import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv as createRedisKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';

import { SystemCacheService } from './system-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const defaultTtlMs = Number(cfg.get<number | string>('CACHE_DEFAULT_TTL_MS') ?? 30_000);
        const lruSize = Number(cfg.get<number | string>('CACHE_MEMORY_LRU_SIZE') ?? 5_000);
        const prefix = cfg.get<string>('CACHE_KEY_PREFIX') ?? 'cp-system';
        const redisUrl = cfg.get<string>('REDIS_URL');
        const memoryStore = new Keyv({
          store: new KeyvCacheableMemory({ ttl: defaultTtlMs, lruSize }),
          namespace: `${prefix}:memory`,
        });

        if (!redisUrl) {
          return { ttl: defaultTtlMs, stores: [memoryStore], nonBlocking: true };
        }

        const redisStore = createRedisKeyv(redisUrl, {
          namespace: `${prefix}:redis`,
          throwOnConnectError: false,
          throwOnErrors: false,
        });

        return {
          ttl: defaultTtlMs,
          stores: [redisStore, memoryStore],
          nonBlocking: true,
        };
      },
    }),
  ],
  providers: [SystemCacheService],
  exports: [SystemCacheService],
})
export class SystemCacheModule {}
