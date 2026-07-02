import { IsNotEmpty, IsString } from 'class-validator';

export class SetCacheDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}
