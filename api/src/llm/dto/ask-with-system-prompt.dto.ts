import { IsOptional, IsString } from 'class-validator';

export class AskWithSystemPromptDto {
  @IsOptional()
  @IsString()
  system: string = 'Assume yourself as a mathematics expert';

  @IsString()
  query: string = 'How to divide 6/0';
}
