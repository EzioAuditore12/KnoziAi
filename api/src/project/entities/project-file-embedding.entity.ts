import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { PROJECT_TABLE_NAME } from './project.entity';

export const PROJECT_FILE_EMBEDDING_TABLE_NAME = 'project_file_embeddings';

@Schema({
  collection: PROJECT_FILE_EMBEDDING_TABLE_NAME,
  timestamps: true,
})
export class ProjectFileEmbedding {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: PROJECT_TABLE_NAME,
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: [Number],
    required: true,
  })
  embedding: number[];

  @Prop({
    type: String,
    required: true,
  })
  content: string;

  @Prop({
    type: {
      text: { type: String, required: false },
      images: { type: [String], required: false, default: [] },
      tables: { type: [String], required: false, default: [] },
    },
    default: {},
  })
  metadata: {
    text?: string;
    images?: string[];
    tables?: string[];
  };

  createdAt: Date;

  updatedAt: Date;
}

export type ProjectFileEmbeddingDocument =
  HydratedDocument<ProjectFileEmbedding>;

export const ProjectFileEmbeddingSchema =
  SchemaFactory.createForClass(ProjectFileEmbedding);
