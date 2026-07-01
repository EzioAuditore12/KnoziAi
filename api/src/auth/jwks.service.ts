import { generateKeyPairSync } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Jwks, JwksDocument } from './entities/jwks.entity';

@Injectable()
export class JwksService implements OnModuleInit {
  constructor(
    @InjectModel(Jwks.name)
    private readonly jwksRepository: Model<JwksDocument>,
  ) {}

  public async onModuleInit() {
    const activeKey = await this.getActiveKey();

    // Write now
    if (!activeKey) await this.generateKeyPair();
  }

  public async generateKeyPair(): Promise<JwksDocument> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return await this.jwksRepository.create({
      publicKey,
      privateKey,
    });
  }

  public async getActiveKey(): Promise<JwksDocument | null> {
    // Finds the most recently created valid key
    return await this.jwksRepository
      .findOne({
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
