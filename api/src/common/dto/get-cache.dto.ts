import { IsNotEmpty, IsString } from 'class-validator';

export class GetCacheDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
