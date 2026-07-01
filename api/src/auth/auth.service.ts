import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import * as argon2 from '@node-rs/argon2';
import { Connection } from 'mongoose';
import { UserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';

import { AccountService } from './account.service';
import refreshJwtConfig from './config/refresh-jwt.config';
import { JwtUserDto } from './dto/jwt-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshJwtUserDto } from './dto/refresh-jwt-user.dto';
import { RegisterLocalDto } from './dto/register-local.dto';
import { TokensDto } from './dto/tokens.dto';
import { Session } from './entities/session.entity';
import { AuthProviderEnum } from './enums/auth-provider.enum';
import { JwksService } from './jwks.service';
import { SessionService } from './session.service';
import { AuthJwtPayload } from './types/auth-jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    private readonly jwtService: JwtService,

    @Inject(refreshJwtConfig.KEY)
    private readonly refreshJwtConfiguration: ConfigType<
      typeof refreshJwtConfig
    >,

    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly sessionService: SessionService,
    private readonly jwksService: JwksService,
  ) {}

  public async registerLocal(
    registerLocalDto: RegisterLocalDto,
  ): Promise<UserDto> {
    const session = await this.connection.startSession();

    session.startTransaction();

    try {
      const { name, email, image, password, role } = registerLocalDto;

      const existingUser = await this.userService.findByEmail(email);

      if (existingUser)
        throw new ConflictException('User with this email already exists');

      const hashedPassword = await argon2.hash(password);

      const user = await this.userService.create({
        name,
        email,
        image,
        role,
      });

      await this.accountService.create({
        userId: user.id,
        provider: AuthProviderEnum.LOCAL,
        providerAccountId: email,
        password: hashedPassword,
      });

      return user;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  public async validate(loginDto: LoginDto): Promise<UserDto> {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const account = await this.accountService.findByProviderAccountId(
      AuthProviderEnum.LOCAL,
      email,
    );

    if (!account || !account.password)
      throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await argon2.verify(account.password, password);

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  public async validateJwtUser(userId: string): Promise<JwtUserDto> {
    const user = await this.userService.findOne(userId);

    if (!user) throw new UnauthorizedException('User not found!');

    const currentUser: JwtUserDto = { id: user.id, role: user.role };

    return currentUser;
  }

  public async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshJwtUserDto> {
    const session = await this.sessionService.findByToken(refreshToken);

    if (!session || session.userId !== userId || session.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');

    return { id: userId, refreshToken };
  }

  public async generateTokens(
    options: Pick<Session, 'userId' | 'ipAddress' | 'userAgent'>,
  ): Promise<TokensDto> {
    const { userId, ipAddress, userAgent } = options;
    // We explicitly inject a unique JWT ID (jti) to prevent generating mathematically
    // identical tokens and DB collisions when multiple requests occur within the same second.
    const payload = {
      id: userId,
      jti: randomUUID(),
    };
    const key = await this.jwksService.getActiveKey();

    if (!key) {
      throw new UnauthorizedException('No active key found');
    }

    const signOptions: JwtSignOptions = {
      secret: key.privateKey,
      algorithm: 'RS256',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, signOptions),
      this.jwtService.signAsync(payload, {
        ...this.refreshJwtConfiguration,
        ...signOptions,
      }),
    ]);

    const decodedRefresh = this.jwtService.decode(refreshToken);
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    await this.sessionService.createSession({
      userId,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  public async refreshTokens(
    options: Pick<Session, 'userId' | 'ipAddress' | 'userAgent'> & {
      oldRefreshToken: string;
    },
  ): Promise<TokensDto> {
    const { userId, oldRefreshToken, ipAddress, userAgent } = options;

    // Immediately invalidate the old refresh token to prevent replay attacks (Refresh Token Rotation)
    await this.sessionService.deleteSession(oldRefreshToken);

    // Generate and issue new tokens for the rotated session
    return await this.generateTokens({ userId, ipAddress, userAgent });
  }

  public async logout(refreshToken: string): Promise<void> {
    await this.sessionService.deleteSession(refreshToken);
  }
}
