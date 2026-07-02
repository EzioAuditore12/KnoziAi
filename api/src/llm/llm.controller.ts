import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AskLlmDto } from './dto/ask-llm.dto';
import { AskWithSystemPromptDto } from './dto/ask-with-system-prompt.dto';
import { LLM_SERVICE, type LlmService } from './interfaces/llm.interface';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(@Inject(LLM_SERVICE) private readonly llmService: LlmService) {}

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask')
  @ApiOperation({
    summary: 'Ask LLM',
    description: 'Use the LLM to answer a single question.',
  })
  public async ask(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.ask(askLlmDto.question);
    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-current-date-time')
  @ApiOperation({
    summary: 'Ask LLM with Date/Time Tool',
    description: 'Use the LLM with the current date/time tool.',
  })
  public async askWithCurrentDateTime(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithCurrentDateTime(
      askLlmDto.question,
    );
    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-system-prompt')
  @ApiOperation({
    summary: 'Ask the LLM a question with a custom system prompt',
    description:
      'Send a query alongside a system prompt to the configured LLM and receive a structured response. Requires authentication.',
  })
  public async askWithSystemPrompt(
    @Body() askWithSystemPromptDto: AskWithSystemPromptDto,
  ) {
    const response = await this.llmService.askWithSystemPrompt(
      askWithSystemPromptDto,
    );
    return { response };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @Sse('ask-stream')
  @ApiOperation({
    summary: 'Stream an LLM response for a basic question',
    description:
      'Stream an LLM response using Server-Sent Events (SSE). Requires the question as a query parameter.',
  })
  public askUsingStream(
    @Query('question') question: string,
  ): Observable<MessageEvent> {
    return from(this.llmService.askUsingStream(question)).pipe(
      map((chunk) => ({ data: chunk }) as MessageEvent),
    );
  }
}
