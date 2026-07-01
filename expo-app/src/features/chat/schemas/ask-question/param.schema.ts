import { z } from 'zod';

export const chatAskQuestionParamSchema = z.object({
  question: z.string(),
});

export type ChatAskQuestionParam = z.infer<typeof chatAskQuestionParamSchema>;
