import KeyvRedis from '@keyv/redis';
import { CacheManagerOptions } from '@nestjs/cache-manager';
import { registerAs } from '@nestjs/config';
import { hours } from '@nestjs/throttler';
import { KeyvCacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import { env } from 'src/env';

export const CACHE_CONFIG_NAME = 'cache';

export default registerAs(CACHE_CONFIG_NAME, (): CacheManagerOptions => ({
  stores: [
    new Keyv({
      // lruSize: 5000 prevents OOM by strictly limiting the cache to 5000 items max.
      // If full, it evicts the Least Recently Used item.
      store: new KeyvCacheableMemory({ ttl: hours(1), lruSize: 5000 }),
    }),
    new KeyvRedis(env.REDIS_URL),
  ],
}));
