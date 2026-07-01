import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const CHAT_TABLE_NAME = 'chats';

@Schema({
  collection: CHAT_TABLE_NAME,
  timestamps: true,
})
export class Chat {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ChatDocument = HydratedDocument<Chat>;
export const ChatSchema = SchemaFactory.createForClass(Chat);
