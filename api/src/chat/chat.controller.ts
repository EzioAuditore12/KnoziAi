import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import Redis from 'ioredis';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-jwt';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { ChatService } from './chat.service';
import { AskChatResponseDto } from './dto/ask-chat-response.dto';
import { AskChatDto } from './dto/ask-chat.dto';
import { ChatHistoryResponseDto } from './dto/chat-history-response.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,

    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  @Sse('stream/:chatId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Stream AI response chunks for a chat' })
  public stream(
    @Req() req: AuthRequest,
    @Param('chatId') chatId: string,
  ): Observable<MessageEvent> {
    const pubSubChannel = `chat_stream_${chatId}`;

    return new Observable((subscriber) => {
      // Create a separate Redis connection for subscribing
      const subscriberClient = this.redis.duplicate();

      subscriberClient.subscribe(pubSubChannel, (err) => {
        if (err) {
          subscriber.error(err);
        }
      });

      subscriberClient.on('message', (channel, message) => {
        if (channel === pubSubChannel) {
          try {
            const parsed = JSON.parse(message);

            if (parsed.done) {
              subscriberClient.unsubscribe(pubSubChannel);
              subscriberClient.quit();
              subscriber.complete();
            } else {
              subscriber.next({ data: parsed } as MessageEvent);
            }
          } catch (e) {
            subscriber.error(e);
          }
        }
      });

      // Cleanup when the client disconnects
      return () => {
        subscriberClient.unsubscribe(pubSubChannel);
        subscriberClient.quit();
      };
    });
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('ask')
  @ApiOperation({
    summary: 'Ask the LLM a question in a chat session',
    description: 'Send a prompt within a chat session context.',
  })
  @ApiBody({ type: AskChatDto })
  @ApiResponse({ type: AskChatResponseDto })
  public async ask(
    @Req() req: AuthRequest,
    @Body() askChatDto: AskChatDto,
  ): Promise<AskChatResponseDto> {
    const userId = req.user.id;
    return this.chatService.ask(userId, askChatDto.question);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiOperation({
    summary: 'Get chat history',
    description: "Returns a paginated list of the user's chat messages.",
  })
  @ApiResponse({ type: ChatHistoryResponseDto })
  public async getHistory(
    @Req() req: AuthRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<ChatHistoryResponseDto> {
    const userId = req.user.id;
    return this.chatService.getHistory(userId, paginationDto);
  }
}
