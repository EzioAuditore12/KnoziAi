import { BullRootModuleOptions } from '@nestjs/bullmq';
import { registerAs } from '@nestjs/config';
import { env } from 'src/env';

export const BULLMQ_CONFIG_NAME = 'bullmq';

export default registerAs(BULLMQ_CONFIG_NAME, (): BullRootModuleOptions => {
  const url = new URL(env.REDIS_URL);

  return {
    connection: {
      host: url.hostname,
      port: Number(url.port),
      username: url.username,
      password: url.password,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    },
    defaultJobOptions: {
      removeOnComplete: true,
      attempts: 3,
    },
  };
});
