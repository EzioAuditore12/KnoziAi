import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hours } from '@nestjs/throttler';
import { Queue } from 'bullmq';
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
    @InjectQueue('chat_queue') private readonly chatQueue: Queue,
  ) {}

  public async ask(
    userId: string,
    question: string,
  ): Promise<AskChatResponseDto> {
    const chat = await this.getOrCreateChat(userId);

    const humanMsg = new HumanMessage(question);
    await this.saveRawMessage(chat._id, MessageRole.USER, humanMsg);

    const job = await this.chatQueue.add('ask', {
      userId,
      chatId: chat._id.toString(),
      question,
    });

    return {
      chatId: chat._id.toString(),
      jobId: job.id,
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

  public async saveRawMessage(
    chatId: Types.ObjectId,
    role: MessageRole,
    msg: BaseMessage,
  ): Promise<void> {
    const payload: Partial<ChatMessage> = {
      chatId,
      role,
      content: msg.content,
    };

    if (msg.name) payload.name = msg.name;

    const aiMsg = msg as AIMessage;
    if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
      payload.toolCalls = aiMsg.tool_calls;
    }

    if ('tool_call_id' in msg) {
      payload.toolCallId = (msg as ToolMessage).tool_call_id;
    }

    await this.chatMessageModel.create(payload);

    const cacheKey = `${this.CACHE_KEY_PREFIX}${chatId.toString()}`;
    const cachedHistory =
      await this.cacheManager.get<Partial<ChatMessage>[]>(cacheKey);

    if (cachedHistory) {
      cachedHistory.push({
        role: payload.role,
        content: payload.content,
        toolCalls: payload.toolCalls,
        toolCallId: payload.toolCallId,
        name: payload.name,
      });

      if (cachedHistory.length > 10) {
        cachedHistory.shift();
      }

      await this.cacheManager.set(cacheKey, cachedHistory, this.CACHE_TTL);
    }
  }

  public async getRecentMessages(
    chatId: Types.ObjectId,
    limit: number,
  ): Promise<Partial<ChatMessage>[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${chatId.toString()}`;
    const cachedHistory =
      await this.cacheManager.get<Partial<ChatMessage>[]>(cacheKey);

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
      toolCalls: msg.toolCalls,
      toolCallId: msg.toolCallId,
      name: msg.name,
    }));

    await this.cacheManager.set(cacheKey, historyToCache, this.CACHE_TTL);

    return historyToCache;
  }

  public async updateChatTimestamp(chatId: Types.ObjectId): Promise<void> {
    await this.chatModel
      .updateOne({ _id: chatId }, { updatedAt: new Date() })
      .exec();
  }

  public formatForLangChain(messages: Partial<ChatMessage>[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === MessageRole.USER) {
        return new HumanMessage(msg.content ?? '');
      } else if (msg.role === MessageRole.ASSISTANT) {
        const kwargs: Record<string, unknown> = { content: msg.content ?? '' };
        if (msg.toolCalls && msg.toolCalls.length > 0)
          kwargs.tool_calls = msg.toolCalls;
        return new AIMessage(kwargs);
      } else if (msg.role === MessageRole.TOOL) {
        return new ToolMessage({
          content: msg.content ?? '',
          tool_call_id: msg.toolCallId ?? '',
          name: msg.name ?? '',
        });
      } else {
        return new SystemMessage(msg.content ?? '');
      }
    });
  }
}
