import 'reflect-metadata';

import { JwtSignOptions } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { config } from 'dotenv';

config();

// A regex to match time formats like '15m', '7d', etc.
const TimeFormatRegex = /^\d+(ms|s|m|h|d)$/;

const GOOGLE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
] as const;

type GoogleGeminiModel = (typeof GOOGLE_GEMINI_MODELS)[number];

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

  @IsString()
  GOOGLE_API_KEY: string;

  @IsEnum(GOOGLE_GEMINI_MODELS)
  GOOGLE_GEMINI_MODEL_ONE: GoogleGeminiModel;

  @IsEnum(GOOGLE_GEMINI_MODELS)
  GOOGLE_GEMINI_MODEL_TWO: GoogleGeminiModel;

  @IsEnum(GOOGLE_GEMINI_MODELS)
  GOOGLE_GEMINI_MODEL_THREE: GoogleGeminiModel;

  @IsNumber()
  @Min(0)
  @Max(1)
  GOOGLE_TEMPERATURE: number;

  @IsInt()
  @IsPositive()
  GOOGLE_MAX_TOKENS: number;

  @IsString()
  REDIS_URL: string;

  @IsString()
  OPENWEATHER_API_KEY: string;

  @IsUrl({ require_tld: false })
  OPENWEATHER_BASE_URL: string;

  @IsString()
  @IsOptional()
  WEATHER_DEFAULT_LOCATION: string = 'Delhi';

  @IsString()
  UNSTRUCTURED_API_KEY: string;

  @IsUrl({ require_tld: false })
  UNSTRUCTURED_API_ENDPOINT: string;

  @IsString()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  CLOUDINARY_API_KEY: string;

  @IsString()
  CLOUDINARY_API_SECRET: string;
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
