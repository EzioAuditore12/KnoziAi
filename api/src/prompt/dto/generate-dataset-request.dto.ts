import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateDatasetRequestDto {
  @IsNumber()
  @IsOptional()
  testCases: number = 3;

  @IsString()
  @IsOptional()
  query: string = 'problems of dependendany injection with langchain in nestjs';
}
