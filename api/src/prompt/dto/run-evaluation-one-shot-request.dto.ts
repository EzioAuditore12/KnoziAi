import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { PromptExampleDto } from './prompt-example.dto';
import { RunEvaluationRequestDto } from './run-evaluation-request.dto';

export class RunEvaluationOneShotRequestDto extends RunEvaluationRequestDto {
  @ApiProperty({
    description: 'A single example to include in the prompt',
    example: {
      inputs: {
        height: '170cm',
        weight: '70kg',
        goal: 'Lose weight',
        restrictions: 'Vegetarian',
      },
      output:
        'Daily caloric total: 1800 kcal.\nMacronutrient breakdown: 130g Protein, 200g Carbs, 50g Fat.\nMeals:\n- Breakfast: Tofu scramble with spinach.\n- Lunch: Quinoa salad with chickpeas.\n- Dinner: Lentil soup with a side salad.',
    },
    type: PromptExampleDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PromptExampleDto)
  promptExample: PromptExampleDto;
}
