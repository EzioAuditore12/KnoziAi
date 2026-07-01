import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { env } from 'src/env';

export const JWT_CONFIG_NAME = 'jwt';

export default registerAs(JWT_CONFIG_NAME, (): JwtModuleOptions => ({
  signOptions: {
    expiresIn: env.JWT_EXPIRE_IN,
  },
}));
