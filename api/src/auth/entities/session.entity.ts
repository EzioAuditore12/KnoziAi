import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, ObjectId } from 'mongoose';

export const SESSION_TABLE_NAME = 'sessions';

@Schema({
  collection: SESSION_TABLE_NAME,
  timestamps: true,
})
export class Session {
  _id: ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  refreshToken: string;

  @Prop({
    type: Date,
    required: true,
  })
  expiresAt: Date;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  ipAddress?: string | null;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  userAgent?: string | null;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId: string;

  createdAt: Date;

  updatedAt: Date;
}

export type SessionDocument = HydratedDocument<Session>;

export const SessionSchema = SchemaFactory.createForClass(Session);
