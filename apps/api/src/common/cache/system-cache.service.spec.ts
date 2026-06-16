import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

import { SystemCacheService } from './system-cache.service';

class MemoryCacheStub {
  store = new Map<string, unknown>();
  failGet = false;
  failSet = false;

  async get<T>(key: string): Promise<T | undefined> {
    if (this.failGet) throw new Error('get failed');
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<T> {
    if (this.failSet) throw new Error('set failed');
    this.store.set(key, value);
    return value;
  }
}

const config = {
  get: (key: string) =>
    ({
      CACHE_ENABLED: 'true',
      CACHE_DEFAULT_TTL_MS: 30_000,
      CACHE_KEY_PREFIX: 'test-cache',
    })[key],
} as unknown as ConfigService;

describe('SystemCacheService', () => {
  it('returns cached values without re-running the loader', async () => {
    const cache = new MemoryCacheStub();
    const service = new SystemCacheService(cache as unknown as Cache, config);
    const loader = jest.fn(async () => ({ ok: true }));

    await expect(service.remember({ namespace: 'n', parts: ['a'] }, loader)).resolves.toEqual({ ok: true });
    await expect(service.remember({ namespace: 'n', parts: ['a'] }, loader)).resolves.toEqual({ ok: true });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('normalizes object keys so equivalent params share one cache key', async () => {
    const cache = new MemoryCacheStub();
    const service = new SystemCacheService(cache as unknown as Cache, config);
    const loader = jest.fn(async () => 'value');

    await service.remember({ namespace: 'n', parts: [{ b: 2, a: 1 }] }, loader);
    await service.remember({ namespace: 'n', parts: [{ a: 1, b: 2 }] }, loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('bumpTags invalidates entries that use those tags', async () => {
    const cache = new MemoryCacheStub();
    const service = new SystemCacheService(cache as unknown as Cache, config);
    const loader = jest.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');

    await expect(service.remember({ namespace: 'n', tags: ['tag'] }, loader)).resolves.toBe('old');
    await service.bumpTags(['tag']);
    await expect(service.remember({ namespace: 'n', tags: ['tag'] }, loader)).resolves.toBe('new');

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('falls back to the loader when cache get or set fails', async () => {
    const cache = new MemoryCacheStub();
    const service = new SystemCacheService(cache as unknown as Cache, config);

    cache.failGet = true;
    await expect(service.remember({ namespace: 'n' }, async () => 'from-loader')).resolves.toBe('from-loader');

    cache.failGet = false;
    cache.failSet = true;
    await expect(service.remember({ namespace: 'other' }, async () => 'still-ok')).resolves.toBe('still-ok');
  });
});
