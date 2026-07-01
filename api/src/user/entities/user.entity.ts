import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { UserRole } from '../enums/user-role.enum';

export const USER_TABLE_NAME = 'users';

@Schema({
  collection: USER_TABLE_NAME,
  timestamps: true,
})
export class User {
  @Prop({
    type: String,
    _id: true,
    default: () => randomUUID(),
  })
  _id: string;

  @Prop({
    type: String,
    required: true,
    maxLength: 100,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  email: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  emailVerified?: boolean;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  image?: string | null;

  @Prop({
    type: String,
    enum: UserRole,
    required: true,
    default: UserRole.USER,
  })
  role?: UserRole;

  createdAt: Date;

  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
