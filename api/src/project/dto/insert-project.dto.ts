import { PickType } from '@nestjs/swagger';

import { Project } from '../entities/project.entity';

export class InsertProjectDto extends PickType(Project, [
  'name',
  'description',
  'fileUrl',
  'fileType',
  'userId',
]) {}
