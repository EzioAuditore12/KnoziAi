import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { RagStrategy } from '../enums/rag-strategy.enum';

export class RetreiveContextDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(RagStrategy)
  strategy?: RagStrategy;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
