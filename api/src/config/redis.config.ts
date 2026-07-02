import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { registerAs } from '@nestjs/config';
import { env } from 'src/env';

export const REDIS_CONFIG_NAME = 'redis';

export default registerAs(REDIS_CONFIG_NAME, (): RedisModuleOptions => ({
  type: 'single',
  url: env.REDIS_URL,
}));
