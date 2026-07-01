import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from '../../dto/login.dto';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // We manually invoke class-validator here. Otherwise, passport-local intercepts
    // missing credentials and throws a generic 401 Unauthorized instead of a detailed 400 Bad Request.
    const body = plainToInstance(LoginDto, request.body);
    const errors = await validate(body);

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints || {}),
      );
      throw new BadRequestException(messages);
    }

    // Validation passed successfully, proceed to passport-local strategy
    return super.canActivate(context) as Promise<boolean>;
  }
}
