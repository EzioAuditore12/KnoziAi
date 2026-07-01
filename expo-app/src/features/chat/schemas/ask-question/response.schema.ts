import { z } from 'zod';

export const chatAskQuestionResponseSchema = z.object({
  chatId: z.string(),
  response: z.string(),
});
