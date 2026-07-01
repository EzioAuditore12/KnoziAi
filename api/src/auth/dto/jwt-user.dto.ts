import { PickType } from '@nestjs/swagger';

import { UserDto } from '../../user/dto/user.dto';

export class JwtUserDto extends PickType(UserDto, ['id', 'role'] as const) {}
