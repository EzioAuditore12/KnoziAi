import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';

import { GeminiIngestionService } from './gemini-ingestion.service';
import { GeminiRetrievalService } from './gemini-retrieval.service';
import { INGESTION_SERVICE } from './interfaces/ingestion.interface';
import { RETRIEVAL_SERVICE } from './interfaces/retrieval.interface';
import { UnstructuredService } from './unstructured.service';

@Module({
  imports: [LlmModule],
  providers: [
    UnstructuredService,
    { provide: INGESTION_SERVICE, useClass: GeminiIngestionService },
    { provide: RETRIEVAL_SERVICE, useClass: GeminiRetrievalService },
  ],
  exports: [INGESTION_SERVICE, RETRIEVAL_SERVICE],
})
export class RagModule {}
