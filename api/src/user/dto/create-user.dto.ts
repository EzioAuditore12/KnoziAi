import { PickType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { UserRole } from '../enums/user-role.enum';
import { UserDto } from './user.dto';

export class CreateUserDto extends PickType(UserDto, [
  'name',
  'email',
  'role',
  'image',
]) {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.USER;

  @IsOptional()
  image: string | null = null;
}
