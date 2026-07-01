import 'reflect-metadata';

import { JwtSignOptions } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  validateSync,
} from 'class-validator';
import { config } from 'dotenv';

config();

// A regex to match time formats like '15m', '7d', etc.
const TimeFormatRegex = /^\d+(ms|s|m|h|d)$/;

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 8000;

  @IsString()
  @IsOptional()
  CORS_ORIGIN = '*';

  @IsString()
  DATABASE_URL: string;

  @Matches(TimeFormatRegex)
  @IsOptional()
  JWT_EXPIRE_IN: JwtSignOptions['expiresIn'] = '15m';

  @Matches(TimeFormatRegex)
  @IsOptional()
  REFRESH_JWT_EXPIRE_IN: JwtSignOptions['expiresIn'] = '7d';

  @IsString()
  SENTRY_DSN: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) throw new Error(errors.toString());

  return validatedConfig;
}

export const env = validate(process.env);
