import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UserDto } from 'src/user/dto/user.dto';

import { TokensDto } from './tokens.dto';

export class AuthResponseDto {
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;

  @ValidateNested()
  @Type(() => TokensDto)
  tokens: TokensDto;
}
