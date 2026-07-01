import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { env } from 'src/env';

export const REFRESH_JWT_CONFIG_NAME = 'refresh-jwt';

export default registerAs(REFRESH_JWT_CONFIG_NAME, (): JwtSignOptions => ({
  expiresIn: env.REFRESH_JWT_EXPIRE_IN,
}));
