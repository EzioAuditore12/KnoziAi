import { z } from 'zod';

import { paginationResponseSchema } from '@/features/common/schemas/pagination/response.schema';
import { chatMessageSchema } from './chat-message.schema';

export const chatHistorySchema = paginationResponseSchema.extend({
  docs: chatMessageSchema.array(),
});

export type ChatHistory = z.infer<typeof chatHistorySchema>;
