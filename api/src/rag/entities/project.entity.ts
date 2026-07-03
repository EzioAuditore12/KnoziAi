import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ProjectFileType } from '../enums/project-file-type.enum';

export const PROJECT_TABLE_NAME = 'projects';

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

  createdAt: Date;

  updatedAt: Date;
}

export type ProjectDocument = HydratedDocument<Project>;

export const ProjectSchema = SchemaFactory.createForClass(Project);
