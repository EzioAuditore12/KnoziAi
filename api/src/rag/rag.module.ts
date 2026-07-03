import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ProjectFileEmbedding,
  ProjectFileEmbeddingSchema,
} from './entities/project-file-embedding.entity';
import { Project, ProjectSchema } from './entities/project.entity';
import { GeminiIngestionService } from './gemini-ingestion.service';
import { GeminiRetrievalService } from './gemini-retrieval.service';
import { INGESTION_SERVICE } from './interfaces/ingestion.interface';
import { RETRIEVAL_SERVICE } from './interfaces/retrieval.interface';
import { RagSetupService } from './rag-setup.service';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { UnstructuredService } from './unstructured.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectFileEmbedding.name, schema: ProjectFileEmbeddingSchema },
    ]),
  ],
  controllers: [RagController],
  providers: [
    RagService,
    RagSetupService,
    UnstructuredService,
    { provide: INGESTION_SERVICE, useClass: GeminiIngestionService },
    { provide: RETRIEVAL_SERVICE, useClass: GeminiRetrievalService },
  ],
})
export class RagModule {}
