import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  limit: number = 10;
}
