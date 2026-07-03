import { GoogleGenerativeAIEmbeddings } from '@dakshp1234/langchain-google-genai';
import { TaskType } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IngestionService } from './interfaces/ingestion.interface';

@Injectable()
export class GeminiIngestionService implements IngestionService {
  private readonly documentEmbeddingModel: GoogleGenerativeAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.documentEmbeddingModel = this.initializeModel();
  }

  private initializeModel(): GoogleGenerativeAIEmbeddings {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    const embeddingModelName = 'gemini-embedding-001';
    const outputDimensionality = 1536;

    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: embeddingModelName,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality,
    });
  }
}
