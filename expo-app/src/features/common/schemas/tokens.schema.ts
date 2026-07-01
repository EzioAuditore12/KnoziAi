import { z } from 'zod';

export const tokensSchema = z.object({
  accessToken: z.jwt(),
  refreshToken: z.jwt(),
});

export type Tokens = z.infer<typeof tokensSchema>;
