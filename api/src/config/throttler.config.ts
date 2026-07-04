import { ExecutionContext } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { minutes, seconds, ThrottlerModuleOptions } from '@nestjs/throttler';

export const THROTTLER_CONFIG_NAME = 'throttler';

export default registerAs(
  THROTTLER_CONFIG_NAME,
  (): ThrottlerModuleOptions => ({
    skipIf: (context: ExecutionContext) => {
      if (context.getType() === 'http') {
        const req = context.switchToHttp().getRequest();
        const path = req.path || req.url;
        return path?.startsWith('/sse') || path?.startsWith('/message');
      }
      return false;
    },
    throttlers: [
      {
        name: 'short',
        ttl: seconds(1),
        limit: 3, // Prevent double-clicks / rapid UI spam
      },
      {
        name: 'medium',
        ttl: seconds(10),
        limit: 20, // Allow normal fast navigation, block scrapers
      },
      {
        name: 'long',
        ttl: minutes(1),
        limit: 100, // Prevent sustained API abuse over a minute
      },
    ],
  }),
);
