import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { AskLlmDto } from './ask-llm.dto';

export class AskLlmWithCacheDto extends AskLlmDto {
  @ApiPropertyOptional({
    description:
      'If true, bypasses the cache and forces a fresh request to the LLM API',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  bypassCache?: boolean;
}
