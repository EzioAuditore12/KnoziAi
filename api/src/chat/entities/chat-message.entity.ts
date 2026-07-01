import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { MessageRole } from '../enums/message-role.enum';
import { CHAT_TABLE_NAME } from './chat.entity';

export const CHAT_MESSAGE_TABLE_NAME = 'chat_messages';

@Schema({
  collection: CHAT_MESSAGE_TABLE_NAME,
  timestamps: true,
})
export class ChatMessage {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: CHAT_TABLE_NAME,
    required: true,
    index: true,
  })
  chatId: Types.ObjectId;

  @Prop({
    type: String,
    enum: MessageRole,
    required: true,
  })
  role: MessageRole;

  @Prop({
    type: String,
    required: true,
  })
  content: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.plugin(mongoosePaginate);
