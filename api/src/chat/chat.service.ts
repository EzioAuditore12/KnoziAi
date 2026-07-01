import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { PaginateModel } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { LLM_SERVICE, type LlmService } from '../llm/interfaces/llm.interface';
import { AskChatResponseDto } from './dto/ask-chat-response.dto';
import {
  ChatMessage,
  ChatMessageDocument,
} from './entities/chat-message.entity';
import { Chat, ChatDocument } from './entities/chat.entity';
import { MessageRole } from './enums/message-role.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: PaginateModel<ChatMessageDocument>,

    @Inject(LLM_SERVICE) private readonly llmService: LlmService,
  ) {}

  public async ask(
    userId: string,
    question: string,
  ): Promise<AskChatResponseDto> {
    const chat = await this.getOrCreateChat(userId);

    await this.saveMessage(chat._id, MessageRole.USER, question);

    const recentHistory = await this.getRecentMessages(chat._id, 10);
    const langchainMessages = this.formatForLangChain(recentHistory);

    const aiResponseContent =
      await this.llmService.askWithContext(langchainMessages);

    await this.saveMessage(chat._id, MessageRole.ASSISTANT, aiResponseContent);
    await this.updateChatTimestamp(chat._id);

    return {
      chatId: chat._id.toString(),
      response: aiResponseContent,
    };
  }

  public async getHistory(userId: string, paginationDto: PaginationDto) {
    const chat = await this.chatModel
      .findOne({ userId })
      .sort({ updatedAt: -1 })
      .exec();

    if (!chat) {
      return {
        docs: [],
        totalDocs: 0,
        limit: paginationDto.limit,
        page: paginationDto.page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    return this.chatMessageModel.paginate(
      { chatId: chat._id },
      {
        page: paginationDto.page,
        limit: paginationDto.limit,
        sort: { createdAt: -1 },
      },
    );
  }

  private async getOrCreateChat(userId: string): Promise<ChatDocument> {
    let chat = await this.chatModel
      .findOne({ userId })
      .sort({ updatedAt: -1 })
      .exec();
    if (!chat) {
      chat = await this.chatModel.create({ userId });
    }
    return chat;
  }

  private async saveMessage(
    chatId: Types.ObjectId,
    role: MessageRole,
    content: string,
  ): Promise<void> {
    await this.chatMessageModel.create({
      chatId,
      role,
      content,
    });
  }

  private async getRecentMessages(
    chatId: Types.ObjectId,
    limit: number,
  ): Promise<ChatMessageDocument[]> {
    const recentHistory = await this.chatMessageModel
      .find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Reverse so chronological order is maintained for LLM
    recentHistory.reverse();
    return recentHistory;
  }

  private async updateChatTimestamp(chatId: Types.ObjectId): Promise<void> {
    await this.chatModel
      .updateOne({ _id: chatId }, { updatedAt: new Date() })
      .exec();
  }

  private formatForLangChain(messages: ChatMessageDocument[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === MessageRole.USER) {
        return new HumanMessage(msg.content);
      } else if (msg.role === MessageRole.ASSISTANT) {
        return new AIMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
  }
}
