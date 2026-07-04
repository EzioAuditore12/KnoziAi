import { unlink } from 'node:fs/promises';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';
import { FormDataRequest } from 'nestjs-form-data';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AskLlmWithCacheDto } from './dto/ask-llm-with-cache.dto';
import { AskLlmWithImageDto } from './dto/ask-llm-with-image.dto';
import { AskLlmWithLargeFileDto } from './dto/ask-llm-with-large-file.dto';
import { AskLlmWithPdfDto } from './dto/ask-llm-with-pdf.dto';
import { AskLlmDto } from './dto/ask-llm.dto';
import { AskWithSystemPromptDto } from './dto/ask-with-system-prompt.dto';
import { LLM_SERVICE, type LlmService } from './interfaces/llm.interface';
import { McpService } from './mcp.service';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(
    @Inject(LLM_SERVICE) private readonly llmService: LlmService,
    private readonly mcpService: McpService,
  ) {}

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
  @Post('ask-with-cache')
  @ApiOperation({
    summary: 'Ask LLM with Prompt Caching',
    description:
      'Use the LLM with an in-memory cache to instantly return repeated queries without hitting the API.',
  })
  public async askWithCache(@Body() askLlmWithCacheDto: AskLlmWithCacheDto) {
    const response = await this.llmService.askWithCache(
      askLlmWithCacheDto.question,
      askLlmWithCacheDto.bypassCache,
    );
    return {
      response,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('clear-cache')
  @ApiOperation({
    summary: 'Clear LLM Cache',
    description: 'Clears the in-memory cache used by the LLM.',
  })
  public clearCache() {
    this.llmService.clearCache();
    return { success: true, message: 'Cache cleared successfully.' };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-image')
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOperation({
    summary: 'Ask LLM with Image',
    description: 'Use the LLM to analyze an image alongside a question.',
  })
  public async askWithImage(@Body() askLlmWithImageDto: AskLlmWithImageDto) {
    try {
      const response = await this.llmService.askWithImage(
        askLlmWithImageDto.question,
        askLlmWithImageDto.file.path,
        askLlmWithImageDto.file.mimeType || 'image/jpeg',
      );
      return { response };
    } finally {
      await unlink(askLlmWithImageDto.file.path).catch(() => {});
    }
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-large-file')
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOperation({
    summary: 'Ask LLM with Large File',
    description:
      'Uploads a large file (e.g. video, large PDF) using the Google File API and queries the LLM with it.',
  })
  public async askWithLargeFile(
    @Body() askLlmWithLargeFileDto: AskLlmWithLargeFileDto,
  ) {
    const file = askLlmWithLargeFileDto.file;
    const response = await this.llmService.askWithLargeFile(
      askLlmWithLargeFileDto.question,
      file.path,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - busBoyMimeType is protected, but we need it here. Or use standard mimeType.
      file.mimeType ?? (file as any).busBoyMimeType,
      file.originalName,
    );

    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-pdf')
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @ApiOperation({
    summary: 'Ask LLM with PDF',
    description: 'Use the LLM to analyze a PDF alongside a question.',
  })
  public async askWithPdf(@Body() askLlmWithPdfDto: AskLlmWithPdfDto) {
    try {
      const response = await this.llmService.askWithPdf(
        askLlmWithPdfDto.question,
        askLlmWithPdfDto.file.path,
        askLlmWithPdfDto.file.mimeType || 'application/pdf',
      );
      return { response };
    } finally {
      await unlink(askLlmWithPdfDto.file.path).catch(() => {});
    }
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-thinking')
  @ApiOperation({
    summary: 'Ask LLM with Thinking',
    description: 'Use the LLM with thinking (e.g. Gemini 2.0 Thinking).',
  })
  public async askWithThinking(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithThinking(askLlmDto.question);
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
  @Post('ask-with-weather')
  @ApiOperation({
    summary: 'Ask LLM with Weather Tool',
    description: 'Use the LLM with the weather tool.',
  })
  public async askWithWeather(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithWeather(askLlmDto.question);
    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-mcp')
  @ApiOperation({
    summary: 'Ask LLM with MCP Tools',
    description: 'Use the LLM with connected MCP tools.',
  })
  public async askWithMcp(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithMcp(askLlmDto.question);
    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-code-execution')
  @ApiOperation({
    summary: 'Ask LLM with Code Execution Tool',
    description: 'Use the LLM with the code execution tool.',
  })
  public async askWithCodeExecution(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithCodeExecution(
      askLlmDto.question,
    );
    return {
      response,
    };
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @HttpCode(HttpStatus.OK)
  @Post('ask-with-web-search')
  @ApiOperation({
    summary: 'Ask LLM with Web Search Tool',
    description: 'Use the LLM with Google Web Search.',
  })
  public async askWithWebSearch(@Body() askLlmDto: AskLlmDto) {
    const response = await this.llmService.askWithWebSearch(askLlmDto.question);
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

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @Sse('ask-with-code-execution-stream')
  @ApiOperation({
    summary: 'Stream an LLM response with Code Execution',
    description:
      'Stream an LLM response using Server-Sent Events (SSE) where the model can execute code. Requires the question as a query parameter.',
  })
  public askWithCodeExecutionStream(
    @Query('question') question: string,
  ): Observable<MessageEvent> {
    return from(this.llmService.askWithCodeExecutionStream(question)).pipe(
      map((chunk) => ({ data: chunk }) as MessageEvent),
    );
  }

  @Throttle({ short: { limit: 5, ttl: minutes(1) } })
  @Sse('ask-with-web-search-stream')
  @ApiOperation({
    summary: 'Stream an LLM response with Web Search',
    description:
      'Stream an LLM response using Server-Sent Events (SSE) where the model can search the web. Requires the question as a query parameter.',
  })
  public askWithWebSearchStream(
    @Query('question') question: string,
  ): Observable<MessageEvent> {
    return from(this.llmService.askWithWebSearchStream(question)).pipe(
      map((chunk) => ({ data: chunk }) as MessageEvent),
    );
  }

  @Get('mcp-tools')
  @ApiOperation({
    summary: 'Get available MCP Tools',
    description:
      'Fetches the list of all connected MCP tools available to the LLM.',
  })
  public async getMcpTools() {
    const tools = await this.mcpService.getMcpTools();

    // Map the complex LangChain tool classes into plain JSON objects
    const formattedTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
    }));

    return { status: 'connected', tools: formattedTools };
  }
}
