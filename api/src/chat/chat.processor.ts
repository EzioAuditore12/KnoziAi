import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Types } from 'mongoose';

import { LLM_SERVICE, type LlmService } from '../llm/interfaces/llm.interface';
import { ChatService } from './chat.service';
import { MessageRole } from './enums/message-role.enum';

export interface ChatJobData {
  userId: string;
  chatId: string;
  question: string;
}

export const CHAT_PROCESSOR_NAME = 'chat_queue';

@Processor(CHAT_PROCESSOR_NAME)
export class ChatProcessor extends WorkerHost {
  constructor(
    private readonly chatService: ChatService,
    @Inject(LLM_SERVICE) private readonly llmService: LlmService,
  ) {
    super();
  }

  async process(job: Job<ChatJobData, any, string>): Promise<any> {
    const { chatId } = job.data;
    const objectId = new Types.ObjectId(chatId);

    const recentHistory = await this.chatService.getRecentMessages(
      objectId,
      10,
    );
    const langchainMessages =
      this.chatService.formatForLangChain(recentHistory);

    const newMessages =
      await this.llmService.askWithToolsAndContext(langchainMessages);

    for (const msg of newMessages) {
      let role = MessageRole.ASSISTANT;
      if (msg.type === 'tool') role = MessageRole.TOOL;

      await this.chatService.saveRawMessage(objectId, role, msg);
    }

    await this.chatService.updateChatTimestamp(objectId);
  }
}
