import { Module } from '@nestjs/common';

import { GeminiIngestionService } from './gemini-ingestion.service';
import { GeminiRetrievalService } from './gemini-retrieval.service';
import { INGESTION_SERVICE } from './interfaces/ingestion.interface';
import { RETRIEVAL_SERVICE } from './interfaces/retrieval.interface';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { UnstructuredService } from './unstructured.service';

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    UnstructuredService,
    { provide: INGESTION_SERVICE, useClass: GeminiIngestionService },
    { provide: RETRIEVAL_SERVICE, useClass: GeminiRetrievalService },
  ],
})
export class RagModule {}
