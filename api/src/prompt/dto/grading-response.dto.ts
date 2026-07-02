import { z } from 'zod';

export const gradingResponseSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('The evaluation score from 0 to 10'),
  reasoning: z
    .string()
    .describe('A brief explanation of why this score was given'),
});
