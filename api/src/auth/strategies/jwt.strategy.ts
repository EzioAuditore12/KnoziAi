import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { JwksService } from '../jwks.service';
import { AuthJwtPayload } from '../types/auth-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly jwksService: JwksService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
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

  validate(payload: AuthJwtPayload) {
    const userId = payload.id;
    return this.authService.validateJwtUser(userId);
  }
}
