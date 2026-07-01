import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AskChatDto {
  @ApiProperty({
    description: 'The question or prompt to send to the LLM',
    example: 'Explain how dependency injection works in NestJS',
  })
  @IsString()
  @IsNotEmpty()
  question: string;
}
