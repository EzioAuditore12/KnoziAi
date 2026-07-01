import { PickType } from '@nestjs/swagger';

import { RegisterLocalDto } from './register-local.dto';

export class LoginDto extends PickType(RegisterLocalDto, [
  'email',
  'password',
]) {}
