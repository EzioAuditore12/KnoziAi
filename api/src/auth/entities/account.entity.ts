import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, ObjectId } from 'mongoose';

import { AuthProviderEnum } from '../enums/auth-provider.enum';

export const ACCOUNT_TABLE_NAME = 'accounts';

@Schema({
  collection: ACCOUNT_TABLE_NAME,
  timestamps: true,
})
export class Account {
  _id: ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId: string; // Links this account to your User table

  @Prop({
    type: String,
    enum: AuthProviderEnum,
    required: true,
  })
  provider: AuthProviderEnum; // e.g., 'google', 'github', 'apple'

  @Prop({
    type: String,
    required: true,
  })
  providerAccountId: string; // The unique ID given by Google/GitHub for this user

  @Prop({
    type: String,
    required: function () {
      return this.provider === AuthProviderEnum.LOCAL;
    },
  })
  password?: string;

  createdAt: Date;

  updatedAt: Date;
}

export type AccountDocument = HydratedDocument<Account>;

export const AccountSchema = SchemaFactory.createForClass(Account);
