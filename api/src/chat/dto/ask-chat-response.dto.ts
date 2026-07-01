import { ApiProperty } from '@nestjs/swagger';

export class AskChatResponseDto {
  @ApiProperty({
    description: 'The ID of the chat session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  chatId: string;

  @ApiProperty({
    description: 'The response from the LLM',
    example: 'Dependency injection is a design pattern...',
  })
  response: string;
}
