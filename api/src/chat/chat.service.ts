import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hours } from '@nestjs/throttler';
import type { Cache } from 'cache-manager';
import { Model, Types } from 'mongoose';
import type { PaginateModel } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { mapToDto } from 'src/utils/dto-mapper.util';

import { LLM_SERVICE, type LlmService } from '../llm/interfaces/llm.interface';
import { AskChatResponseDto } from './dto/ask-chat-response.dto';
import { ChatHistoryResponseDto } from './dto/chat-history-response.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import {
  ChatMessage,
  ChatMessageDocument,
} from './entities/chat-message.entity';
import { Chat, ChatDocument } from './entities/chat.entity';
import { MessageRole } from './enums/message-role.enum';

@Injectable()
export class ChatService {
  private readonly CACHE_KEY_PREFIX = 'chat_history_';
  private readonly CACHE_TTL = hours(1);

  constructor(
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: PaginateModel<ChatMessageDocument>,

    @Inject(LLM_SERVICE) private readonly llmService: LlmService,

    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

  public async getHistory(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<ChatHistoryResponseDto> {
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
        pagingCounter: 1,
        hasNextPage: false,
        hasPrevPage: false,
        prevPage: null,
        nextPage: null,
      };
    }

    const result = await this.chatMessageModel.paginate(
      { chatId: chat._id },
      {
        page: paginationDto.page,
        limit: paginationDto.limit,
        sort: { createdAt: -1 },
      },
    );

    return {
      ...result,
      page: result.page ?? paginationDto.page,
      prevPage: result.prevPage ?? null,
      nextPage: result.nextPage ?? null,
      docs: result.docs.map((doc) => mapToDto(ChatMessageDto, doc)),
    };
  }

  private async getOrCreateChat(userId: string): Promise<ChatDocument> {
    let chat = await this.chatModel
      .findOne({ userId })
      .sort({ updatedAt: -1 })
      .exec();

    if (!chat) chat = await this.chatModel.create({ userId });

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

    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${chatId.toString()}`);
  }

  private async getRecentMessages(
    chatId: Types.ObjectId,
    limit: number,
  ): Promise<{ role: MessageRole; content: string }[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${chatId.toString()}`;
    const cachedHistory =
      await this.cacheManager.get<{ role: MessageRole; content: string }[]>(
        cacheKey,
      );

    if (cachedHistory) return cachedHistory;

    const recentHistory = await this.chatMessageModel
      .find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Reverse so chronological order is maintained for LLM
    recentHistory.reverse();

    const historyToCache = recentHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    await this.cacheManager.set(cacheKey, historyToCache, this.CACHE_TTL);

    return historyToCache;
  }

  private async updateChatTimestamp(chatId: Types.ObjectId): Promise<void> {
    await this.chatModel
      .updateOne({ _id: chatId }, { updatedAt: new Date() })
      .exec();
  }

  private formatForLangChain(
    messages: { role: MessageRole; content: string }[],
  ): BaseMessage[] {
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
