import { ChatGoogleGenerativeAI } from '@dakshp1234/langchain-google-genai';
import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { AskWithSystemPromptDto } from './dto/ask-with-system-prompt.dto';
import {
  AskWithSystemResponseDto,
  askWithSystemResponseSchema,
} from './dto/ask-with-system-response.dto';
import { LlmService } from './interfaces/llm.interface';

@Injectable()
export class GeminiLlmService implements LlmService {
  private model: ChatGoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY')!;
    const modelOne =
      this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE') ||
      'gemini-3.1-flash-lite-preview';
    const modelTwo =
      this.configService.get<string>('GOOGLE_GEMINI_MODEL_TWO') ||
      'gemini-3-flash-preview';
    const modelThree =
      this.configService.get<string>('GOOGLE_GEMINI_MODEL_THREE') ||
      'gemini-2.5-flash';

    // Increased max tokens and moved configuration potential to configService
    const maxTokens =
      this.configService.get<number>('GOOGLE_MAX_TOKENS') || 8192;
    const temperature =
      this.configService.get<number>('GOOGLE_TEMPERATURE') || 0.7;

    const createModel = (modelName: string) =>
      new ChatGoogleGenerativeAI(modelName, {
        apiKey,
        temperature,
        maxOutputTokens: maxTokens, // Fixed truncation wall
        maxRetries: 1,
      });

    const baseModel = createModel(modelOne);
    const fallbacks: ChatGoogleGenerativeAI[] = [];

    if (modelTwo) fallbacks.push(createModel(modelTwo));
    if (modelThree) fallbacks.push(createModel(modelThree));

    const fallbackModel = baseModel.withFallbacks({ fallbacks });

    // Monkey-patch withStructuredOutput securely
    (fallbackModel as any).withStructuredOutput = (schema: any) => {
      return baseModel.withStructuredOutput(schema).withFallbacks({
        fallbacks: fallbacks.map((m) => m.withStructuredOutput(schema)),
      });
    };

    this.model = fallbackModel as unknown as ChatGoogleGenerativeAI;
  }

  public async ask(question: string): Promise<string> {
    const response = await this.model.invoke(question);
    return response.content ? response.content.toString() : response.toString();
  }

  public async askWithContext(messages: BaseMessage[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return response.content ? response.content.toString() : response.toString();
  }

  public async *askUsingStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(question);
    for await (const chunk of stream) {
      const content = chunk.content;
      yield content ? content.toString() : chunk.toString();
    }
  }

  public async *askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(messages);
    for await (const chunk of stream) {
      const content = chunk.content;
      yield content ? content.toString() : chunk.toString();
    }
  }

  public async askWithSystemPrompt(
    askWithSystemPromptDto: AskWithSystemPromptDto,
  ): Promise<AskWithSystemResponseDto> {
    const { system, query } = askWithSystemPromptDto;
    const structuredLlm = this.model.withStructuredOutput(
      askWithSystemResponseSchema,
    );
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', '{system}'],
      ['human', '{query}'],
    ]);

    const chain = prompt.pipe(structuredLlm);
    return await chain.invoke({ system, query });
  }

  public async askWithStructuredOutput<T>(
    promptText: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const structuredLlm = this.model.withStructuredOutput(schema);
    const prompt = ChatPromptTemplate.fromMessages([['human', '{query}']]);
    const chain = prompt.pipe(structuredLlm);

    return (await chain.invoke({ query: promptText })) as T;
  }
}
