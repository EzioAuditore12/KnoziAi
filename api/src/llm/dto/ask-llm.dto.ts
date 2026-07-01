import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AskLlmDto {
  @ApiProperty({
    description: 'The question or prompt to send to the LLM',
    example: 'Explain how dependency injection works in NestJS',
  })
  @IsString()
  @IsNotEmpty()
  question: string;
}
