import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { GenerateDatasetRequestDto } from './generate-dataset-request.dto';

export class RunEvaluationRequestDto extends GenerateDatasetRequestDto {
  @IsString()
  @IsOptional()
  extraCriteria: string =
    'The output should include Daily caloric total, Macronutrient breakdown, and Meals with exact foods.';

  @IsString()
  @IsNotEmpty()
  promptTemplate: string =
    'What should this person eat? Height: {height}, Weight: {weight}, Goal: {goal}, Restrictions: {restrictions}';
}
