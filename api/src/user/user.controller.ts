import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import type { AuthRequest } from 'src/auth/types/auth-jwt';

import { UserDto } from './dto/user.dto';
import { UserRole } from './enums/user-role.enum';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the profile of the currently authenticated user based on their JWT.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  public async getProfile(@Req() req: AuthRequest): Promise<UserDto> {
    const userId = req.user.id;

    const user = await this.userService.findOne(userId);

    if (!user)
      throw new NotFoundException(`Unable to find user with id ${userId}`);

    return user;
  }

  @ApiOperation({
    summary: 'Admin-only route',
    description:
      'A protected route that can only be accessed by users with the ADMIN role.',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin')
  public adminOnlyRoute(): string {
    return 'You have successfully accessed the admin only route!';
  }
}
