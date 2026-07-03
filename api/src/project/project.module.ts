import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RagModule } from 'src/rag/rag.module';

import {
  ProjectFileEmbedding,
  ProjectFileEmbeddingSchema,
} from './entities/project-file-embedding.entity';
import { Project, ProjectSchema } from './entities/project.entity';
import { ProjectSetupService } from './project-setup.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [
    HttpModule,
    RagModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectFileEmbedding.name, schema: ProjectFileEmbeddingSchema },
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectSetupService, ProjectService],
})
export class ProjectModule {}
