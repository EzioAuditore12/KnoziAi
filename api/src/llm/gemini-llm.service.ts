import { ChatGoogleGenerativeAI } from '@dakshp1234/langchain-google-genai';
import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    const llmModel = this.configService.get<string>('GOOGLE_GEMINI_MODEL')!;

    this.model = new ChatGoogleGenerativeAI(llmModel, {
      apiKey,
      temperature: 0.7,
      maxOutputTokens: 2000,
      maxRetries: 2,
    });
  }

  public async ask(question: string): Promise<string> {
    const response = await this.model.invoke(question);
    return response.content.toString();
  }

  public async askWithContext(messages: BaseMessage[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return response.content.toString();
  }

  public async *askUsingStream(
    question: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(question);
    for await (const chunk of stream) {
      yield chunk.content.toString();
    }
  }

  public async *askWithContextUsingStream(
    messages: BaseMessage[],
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.model.stream(messages);
    for await (const chunk of stream) {
      yield chunk.content.toString();
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

    const response = await chain.invoke({ system, query });

    return response;
  }
}
