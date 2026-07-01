import { ChatGoogleGenerativeAI } from '@dakshp1234/langchain-google-genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
}
