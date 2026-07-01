import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM']),
  content: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
