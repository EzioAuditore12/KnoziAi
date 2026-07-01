import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

import { ChatMessageDto } from './chat-message.dto';

export class ChatHistoryResponseDto extends PaginationResponseDto {
  @ApiProperty({
    type: [ChatMessageDto],
    description: 'List of chat messages in this page',
  })
  @Type(() => ChatMessageDto)
  docs: ChatMessageDto[];
}
