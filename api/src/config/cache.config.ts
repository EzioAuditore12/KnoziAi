import KeyvRedis from '@keyv/redis';
import { CacheManagerOptions } from '@nestjs/cache-manager';
import { registerAs } from '@nestjs/config';
import { KeyvCacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import { env } from 'src/env';

export const CACHE_CONFIG_NAME = 'cache';

export default registerAs(CACHE_CONFIG_NAME, (): CacheManagerOptions => ({
  stores: [
    new Keyv({
      store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
    }),
    new KeyvRedis(env.REDIS_URL),
  ],
}));
