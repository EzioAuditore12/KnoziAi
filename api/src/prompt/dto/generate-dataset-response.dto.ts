import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { z } from 'zod';

export const generateDatasetResponseSchema = z.object({
  dataset: z
    .array(
      z.object({
        task: z.string().describe('Description of the evaluation task'),
      }),
    )
    .describe('An array of evaluation tasks'),
});

export type GenerateDatasetResponse = z.infer<
  typeof generateDatasetResponseSchema
>;

export class EvaluationTaskDto {
  @IsString()
  @IsNotEmpty()
  task: string;
}

export class GenerateDatasetResponseDto implements GenerateDatasetResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationTaskDto)
  dataset: EvaluationTaskDto[];
}
