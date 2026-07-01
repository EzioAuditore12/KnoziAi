import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateSessionDto } from './dto/create-session.dto';
import { Session, SessionDocument } from './entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionRepository: Model<SessionDocument>,
  ) {}

  public async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionDocument> {
    const hashedToken = this.hashToken(createSessionDto.refreshToken);
    return await this.sessionRepository.create({
      ...createSessionDto,
      refreshToken: hashedToken,
    });
  }

  public async findByToken(
    refreshToken: string,
  ): Promise<SessionDocument | null> {
    const hashedToken = this.hashToken(refreshToken);
    return await this.sessionRepository
      .findOne({ refreshToken: hashedToken })
      .exec();
  }

  public async deleteSession(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    await this.sessionRepository
      .deleteOne({ refreshToken: hashedToken })
      .exec();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
