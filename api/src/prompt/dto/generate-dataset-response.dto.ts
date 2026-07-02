import { Type } from 'class-transformer';
import { IsArray, IsObject, ValidateNested } from 'class-validator';

export class EvaluationTaskDto {
  @IsObject()
  inputs: Record<string, any>;
}

export class GenerateDatasetResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationTaskDto)
  dataset: EvaluationTaskDto[];
}
