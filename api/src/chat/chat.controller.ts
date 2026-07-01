import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-jwt';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { ChatService } from './chat.service';
import { AskChatResponseDto } from './dto/ask-chat-response.dto';
import { AskChatDto } from './dto/ask-chat.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
  public async getHistory(
    @Req() req: AuthRequest,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user.id;
    return this.chatService.getHistory(userId, paginationDto);
  }
}
