import { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';

import { AskWithSystemPromptDto } from '../dto/ask-with-system-prompt.dto';
import { AskWithSystemResponseDto } from '../dto/ask-with-system-response.dto';

export const LLM_SERVICE = 'LLM_SERVICE';

export interface LlmService {
  ask(question: string): Promise<string>;

  askWithCache(question: string, bypassCache?: boolean): Promise<any>;

  clearCache(): void;

  askWithCurrentDateTime(question: string): Promise<string>;

  askWithWeather(question: string): Promise<string>;

  askWithMcp(question: string): Promise<string>;

  askWithCodeExecution(question: string): Promise<string>;

  askWithCodeExecutionStream(
    question: string,
  ): AsyncGenerator<string, void, unknown>;

  askWithWebSearch(question: string): Promise<string>;

  askWithWebSearchStream(
    question: string,
  ): AsyncGenerator<string, void, unknown>;

  askWithContext(messages: BaseMessage[]): Promise<string>;

  askWithToolsAndContext(messages: BaseMessage[]): Promise<BaseMessage[]>;

  askWithToolsAndContextStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, BaseMessage[], unknown>;

  askWithSystemPrompt(
    askWithSystemPromptDto: AskWithSystemPromptDto,
  ): Promise<AskWithSystemResponseDto>;

  askWithImage(
    question: string,
    imagePath: string,
    mimeType: string,
  ): Promise<any>;

  askWithPdf(question: string, pdfPath: string, mimeType: string): Promise<any>;

  askWithLargeFile(
    question: string,
    filePath: string,
    mimeType: string,
    displayName?: string,
  ): Promise<any>;

  askUsingStream(question: string): AsyncGenerator<string, void, unknown>;

  askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown>;

  askWithStructuredOutput<T>(
    promptText: string,
    schema: z.ZodType<T>,
  ): Promise<T>;

  askWithThinking(question: string): Promise<any>;
}
