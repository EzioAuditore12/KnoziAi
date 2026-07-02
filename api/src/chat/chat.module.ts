import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LlmModule } from '../llm/llm.module';
import { ChatController } from './chat.controller';
import { CHAT_PROCESSOR_NAME, ChatProcessor } from './chat.processor';
import { ChatService } from './chat.service';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import { Chat, ChatSchema } from './entities/chat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    BullModule.registerQueue({ name: CHAT_PROCESSOR_NAME }),
    LlmModule,
  ],
  providers: [ChatService, ChatProcessor],
  controllers: [ChatController],
})
export class ChatModule {}
