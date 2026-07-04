import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';
import { RagStrategy } from 'src/rag/enums/rag-strategy.enum';

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

  @ApiPropertyOptional({ enum: RagStrategy })
  @IsOptional()
  @IsEnum(RagStrategy)
  ragStrategy?: RagStrategy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reRankingModel?: string;
}
