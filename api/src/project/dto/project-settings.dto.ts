import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { RagStrategy } from '../../rag/enums/rag-strategy.enum';

@Exclude()
export class ProjectSettingsDto {
  @Expose()
  @ApiPropertyOptional({ enum: RagStrategy })
  @IsOptional()
  @IsEnum(RagStrategy)
  ragStrategy?: RagStrategy;

  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reRankingModel?: string;

  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  embeddingModel?: string;

  @Expose()
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  outputDimensionality?: number;
}
