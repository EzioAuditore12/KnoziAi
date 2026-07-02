import { z } from 'zod';

export const chatAskQuestionResponseSchema = z.object({
  chatId: z.string(),
  jobId: z.string().optional(),
  response: z.string().optional(),
});
