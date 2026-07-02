import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class PromptExampleDto {
  @IsObject()
  @IsNotEmpty()
  inputs: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  output: string;
}
