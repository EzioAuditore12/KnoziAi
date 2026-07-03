import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { RagStrategy } from '../../rag/enums/rag-strategy.enum';
import { ProjectFileType } from '../enums/project-file-type.enum';
import { ProjectStatus } from '../enums/project-status.enum';

export const PROJECT_TABLE_NAME = 'projects';

@Schema({ _id: false })
export class ProjectSettings {
  @Prop({ type: String, default: 'gemini-embedding-001', required: true })
  embeddingModel: string;

  @Prop({
    type: String,
    enum: RagStrategy,
    default: RagStrategy.BASIC,
    required: true,
  })
  ragStrategy?: RagStrategy;

  @Prop({ type: String, default: null, required: false })
  reRankingModel?: string | null;

  @Prop({ type: Number, default: null, required: false })
  outputDimensionality?: number | null;
}

@Schema({
  collection: PROJECT_TABLE_NAME,
  timestamps: true,
})
export class Project {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    maxlength: 50,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  userId: string;

  @Prop({
    type: String,
    required: false,
    default: null,
  })
  description?: string | null;

  @Prop({
    type: String,
    required: true,
  })
  fileUrl: string;

  @Prop({
    type: String,
    enum: ProjectFileType,
    required: true,
  })
  fileType: ProjectFileType;

  @Prop({
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Prop({ type: ProjectSettings, default: () => ({}) })
  settings?: ProjectSettings;

  createdAt: Date;

  updatedAt: Date;
}

export type ProjectDocument = HydratedDocument<Project>;

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.plugin(mongoosePaginate);
