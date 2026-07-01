import { IsStrongPassword } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class RegisterLocalDto extends CreateUserDto {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
}
