import type { Request } from 'express';

import { JwtUserDto } from '../dto/jwt-user.dto';

export type AuthJwtPayload = Pick<JwtUserDto, 'id'>;

export interface AuthRequest extends Request {
  user: JwtUserDto;
}
