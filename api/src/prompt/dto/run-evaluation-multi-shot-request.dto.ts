import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

import { PromptExampleDto } from './prompt-example.dto';
import { RunEvaluationRequestDto } from './run-evaluation-request.dto';

export class RunEvaluationMultiShotRequestDto extends RunEvaluationRequestDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PromptExampleDto)
  promptExamples: PromptExampleDto[] = [
    {
      inputs: {
        height: '170cm',
        weight: '70kg',
        goal: 'Lose weight',
        restrictions: 'Vegetarian',
      },
      output:
        'Daily caloric total: 1800 kcal.\nMacronutrient breakdown: 130g Protein, 200g Carbs, 50g Fat.\nMeals:\n- Breakfast: Tofu scramble with spinach.\n- Lunch: Quinoa salad with chickpeas.\n- Dinner: Lentil soup with a side salad.',
    },
    {
      inputs: {
        height: '190cm',
        weight: '100kg',
        goal: 'Build muscle',
        restrictions: 'None',
      },
      output:
        'Daily caloric total: 3500 kcal.\nMacronutrient breakdown: 220g Protein, 400g Carbs, 110g Fat.\nMeals:\n- Breakfast: 6 eggs, oatmeal.\n- Lunch: Chicken breast, rice, broccoli.\n- Dinner: Steak, sweet potato.',
    },
  ];
}
