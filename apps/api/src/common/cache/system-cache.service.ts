import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import type { Cache } from 'cache-manager';

export interface SystemCacheRememberOptions {
  namespace: string;
  parts?: unknown[];
  tags?: string[];
  ttlMs?: number;
}

@Injectable()
export class SystemCacheService {
  private readonly logger = new Logger(SystemCacheService.name);
  private readonly enabled: boolean;
  private readonly defaultTtlMs: number;
  private readonly prefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {
    const enabled = this.config.get<boolean | string>('CACHE_ENABLED');
    this.enabled = enabled !== false && enabled !== 'false';
    this.defaultTtlMs = Number(this.config.get<number | string>('CACHE_DEFAULT_TTL_MS') ?? 30_000);
    this.prefix = this.config.get<string>('CACHE_KEY_PREFIX') ?? 'cp-system';
  }

  async remember<T>(opts: SystemCacheRememberOptions, loader: () => Promise<T>): Promise<T> {
    if (!this.enabled) return loader();

    const key = await this.dataKey(opts);
    try {
      const cached = await this.cache.get<T>(key);
      if (cached !== undefined) return cached;
    } catch (err) {
      this.warn('get', key, err);
    }

    const value = await loader();
    try {
      await this.cache.set(key, value, opts.ttlMs ?? this.defaultTtlMs);
    } catch (err) {
      this.warn('set', key, err);
    }
    return value;
  }

  async bumpTags(tags: string[]): Promise<void> {
    if (!this.enabled) return;
    const uniqueTags = [...new Set(tags.filter(Boolean))];
    await Promise.all(
      uniqueTags.map(async (tag) => {
        const key = this.tagKey(tag);
        try {
          await this.cache.set(key, `${Date.now()}:${randomUUID()}`, 0);
        } catch (err) {
          this.warn('bump', key, err);
        }
      }),
    );
  }

  stableStringify(value: unknown): string {
    return JSON.stringify(this.normalize(value));
  }

  private async dataKey(opts: SystemCacheRememberOptions): Promise<string> {
    const tags = [...new Set(opts.tags ?? [])].sort();
    const tagVersions = await Promise.all(tags.map(async (tag) => [tag, await this.tagVersion(tag)] as const));
    const payload = this.stableStringify({
      parts: opts.parts ?? [],
      tags: tagVersions,
    });
    return `${this.prefix}:v1:data:${opts.namespace}:${this.hash(payload)}`;
  }

  private async tagVersion(tag: string): Promise<string> {
    const key = this.tagKey(tag);
    try {
      return (await this.cache.get<string>(key)) ?? '0';
    } catch (err) {
      this.warn('tag', key, err);
      return '0';
    }
  }

  private tagKey(tag: string): string {
    return `${this.prefix}:v1:tag:${tag}`;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 32);
  }

  private normalize(value: unknown): unknown {
    if (value === undefined) return null;
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((item) => this.normalize(item));

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) out[key] = this.normalize(item);
    }
    return out;
  }

  private warn(action: string, key: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Cache ${action} failed for ${key}: ${message}`);
  }
}
