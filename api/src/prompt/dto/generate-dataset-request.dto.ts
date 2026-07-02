import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateDatasetRequestDto {
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  testCases: number = 3;

  @IsString()
  @IsNotEmpty()
  taskDescription: string =
    'Write a compact 1 day meal plan for a single athlete';

  @IsObject()
  @IsNotEmpty()
  promptInputsSpec: Record<string, string> = {
    height: "Athlete's height in cm",
    weight: "Athlete's weight in kg",
    goal: 'Goal of the athlete',
    restrictions: 'Dietary restrictions of the athlete',
  };
}
