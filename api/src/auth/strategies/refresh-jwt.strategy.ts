import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { REFRESH_JWT_CONFIG_NAME } from '../config/refresh-jwt.config';
import { JwksService } from '../jwks.service';
import { AuthJwtPayload } from '../types/auth-jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  REFRESH_JWT_CONFIG_NAME,
) {
  constructor(
    private readonly jwksService: JwksService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      passReqToCallback: true,
      secretOrKeyProvider: async (
        request: any,
        rawJwtToken: any,
        done: any,
      ) => {
        try {
          const key = await this.jwksService.getActiveKey();
          if (!key) {
            return done(new UnauthorizedException('No active key found'), null);
          }
          done(null, key.publicKey);
        } catch (error) {
          done(error, null);
        }
      },
    });
  }

  validate(req: Request, payload: AuthJwtPayload) {
    //@ts-ignore
    const refreshToken = req.body.refreshToken as string;
    const userId = payload.id;
    return this.authService.validateRefreshToken(userId, refreshToken);
  }
}
