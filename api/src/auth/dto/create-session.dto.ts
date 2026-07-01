import { PickType } from '@nestjs/swagger';

import { Session } from '../entities/session.entity';

export class CreateSessionDto extends PickType(Session, [
  'userId',
  'refreshToken',
  'ipAddress',
  'userAgent',
  'expiresAt',
] as const) {}
