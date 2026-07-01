import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

import { ChatMessage } from '../entities/chat-message.entity';
import { MessageRole } from '../enums/message-role.enum';

@Exclude()
export class ChatMessageDto implements Omit<Partial<ChatMessage>, 'chatId'> {
  @Expose({ name: 'id' })
  @Transform(
    ({ obj }: { obj: ChatMessage & { id: string } }) =>
      obj._id ?? obj.id?.toString(),
    { toClassOnly: true },
  )
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.chatId?.toString(), { toClassOnly: true })
  declare chatId: string;

  @Expose()
  role: MessageRole;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
