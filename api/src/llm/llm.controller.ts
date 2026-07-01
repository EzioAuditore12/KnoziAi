import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';

import { AskLlmDto } from './dto/ask-llm.dto';
import { LLM_SERVICE, type LlmService } from './interfaces/llm.interface';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(@Inject(LLM_SERVICE) private readonly llmService: LlmService) {}

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask')
  @ApiOperation({
    summary: 'Ask the LLM a question',
    description:
      'Send a prompt to the configured LLM and receive a text response. Requires authentication.',
  })
  public async ask(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.ask(askLlmDto.question);
    return { response };
  }
}
