import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';

import { ProjectSettingsDto } from './project-settings.dto';
import { ProjectDto } from './project.dto';

export class CreateProjectSettingsDto extends OmitType(ProjectSettingsDto, [
  'embeddingModel',
  'outputDimensionality',
]) {}

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

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProjectSettingsDto)
  settings?: CreateProjectSettingsDto;
}
