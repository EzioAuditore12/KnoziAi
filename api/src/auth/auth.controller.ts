import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UserDto } from 'src/user/dto/user.dto';

import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshJwtUserDto } from './dto/refresh-jwt-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterLocalDto } from './dto/register-local.dto';
import { TokensDto } from './dto/tokens.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Extremely strict throttle on registration to prevent automated spam accounts.
   */
  @Throttle({ short: { limit: 3, ttl: minutes(30) } })
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Registers a new user using local authentication and returns the user profile along with authentication tokens.',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  public async registerLocal(
    @Req() req: Request,
    @Body() registerLocalDto: RegisterLocalDto,
  ): Promise<AuthResponseDto> {
    const user = await this.authService.registerLocal(registerLocalDto);
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const tokens = await this.authService.generateTokens({
      userId: user.id,
      ipAddress,
      userAgent,
    });
    return { user, tokens };
  }

  /**
   * Strict throttle to prevent brute-force and credential stuffing attacks.
   */
  @Throttle({ short: { limit: 5, ttl: minutes(15) } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates a user using their email and password, returning the user object and authentication tokens.',
  })
  @ApiBody({ type: LoginDto })
  public async login(
    @Req() req: Request & { user: UserDto },
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const tokens = await this.authService.generateTokens({
      userId: req.user.id,
      ipAddress,
      userAgent,
    });
    return { user: req.user, tokens };
  }

  /**
   * Throttle refresh token rotation to prevent accidental or malicious spamming.
   */
  @Throttle({ short: { limit: 3, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Generates new access and refresh tokens using a valid refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  public async refresh(
    @Req() req: Request & { user: RefreshJwtUserDto },
  ): Promise<TokensDto> {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.refreshTokens({
      userId: req.user.id,
      oldRefreshToken: req.user.refreshToken,
      ipAddress,
      userAgent,
    });
  }

  @Throttle({ short: { limit: 3, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the given refresh token by removing the session.',
  })
  @ApiBody({ type: RefreshTokenDto })
  public async logout(
    @Body() { refreshToken }: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(refreshToken);
  }
}
