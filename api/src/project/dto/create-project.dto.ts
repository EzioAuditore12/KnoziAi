import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';

import { ProjectDto } from './project.dto';

export class CreateProjectDto extends PickType(ProjectDto, [
  'name',
  'description',
]) {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  declare description?: string | null;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsFile()
  @HasMimeType(['application/pdf'])
  file: FileSystemStoredFile;
}
