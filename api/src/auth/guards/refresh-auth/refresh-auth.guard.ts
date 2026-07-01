import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REFRESH_JWT_CONFIG_NAME } from 'src/auth/config/refresh-jwt.config';

@Injectable()
export class RefreshAuthGuard extends AuthGuard(REFRESH_JWT_CONFIG_NAME) {}
