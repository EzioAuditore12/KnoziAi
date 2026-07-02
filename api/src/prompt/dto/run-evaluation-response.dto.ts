import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

import { EvaluationTaskDto } from './generate-dataset-response.dto';

export class EvaluationResultDto {
  @IsString()
  output: string;

  @ValidateNested()
  @Type(() => EvaluationTaskDto)
  testCase: EvaluationTaskDto;

  @IsNumber()
  score: number;

  @IsString()
  reasoning: string;
}

export class RunEvaluationResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationResultDto)
  results: EvaluationResultDto[];
}
