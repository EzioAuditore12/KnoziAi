import type { MessageContent } from '@langchain/core/messages';
import { ToolCall } from '@langchain/core/messages/tool';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
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
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  content: MessageContent;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  toolCalls?: ToolCall[];

  @Prop({
    type: String,
    required: false,
  })
  toolCallId?: string;

  @Prop({
    type: String,
    required: false,
  })
  name?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.plugin(mongoosePaginate);
