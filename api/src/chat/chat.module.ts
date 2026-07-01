import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LlmModule } from '../llm/llm.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import { Chat, ChatSchema } from './entities/chat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    LlmModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
