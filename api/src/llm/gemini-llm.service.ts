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
    const modelOne =
      this.configService.get<string>('GOOGLE_GEMINI_MODEL_ONE') ||
      'gemini-3.1-flash-lite-preview';
    const modelTwo = this.configService.get<string>('GOOGLE_GEMINI_MODEL_TWO');
    const modelThree = this.configService.get<string>(
      'GOOGLE_GEMINI_MODEL_THREE',
    );

    const createModel = (modelName: string) =>
      new ChatGoogleGenerativeAI(modelName, {
        apiKey,
        temperature: 0.7,
        maxOutputTokens: 2000,
        maxRetries: 1, // reduced to rely on fallbacks
      });

    const baseModel = createModel(modelOne);
    const fallbacks: ChatGoogleGenerativeAI[] = [];

    if (modelTwo) fallbacks.push(createModel(modelTwo));
    if (modelThree) fallbacks.push(createModel(modelThree));

    const fallbackModel = baseModel.withFallbacks({ fallbacks });

    // Monkey-patch withStructuredOutput so it doesn't crash at runtime when the method is called!
    (fallbackModel as any).withStructuredOutput = (schema: any) => {
      return baseModel.withStructuredOutput(schema).withFallbacks({
        fallbacks: fallbacks.map((m) => m.withStructuredOutput(schema)),
      });
    };

    // We trick TS here as requested so the methods stay completely clean
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

    const response = await chain.invoke({ system, query });

    return response;
  }
}
