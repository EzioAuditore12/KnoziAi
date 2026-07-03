import { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';

import { AskWithSystemPromptDto } from '../dto/ask-with-system-prompt.dto';
import { AskWithSystemResponseDto } from '../dto/ask-with-system-response.dto';

export const LLM_SERVICE = 'LLM_SERVICE';

export interface LlmService {
  ask(question: string): Promise<string>;

  askWithCurrentDateTime(question: string): Promise<string>;

  askWithWeather(question: string): Promise<string>;

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

  askUsingStream(question: string): AsyncGenerator<string, void, unknown>;

  askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown>;

  askWithStructuredOutput<T>(
    promptText: string,
    schema: z.ZodType<T>,
  ): Promise<T>;
}
