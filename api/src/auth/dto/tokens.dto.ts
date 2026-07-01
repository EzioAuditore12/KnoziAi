import { IsJWT } from 'class-validator';

export class TokensDto {
  @IsJWT()
  accessToken: string;

  @IsJWT()
  refreshToken: string;
}
