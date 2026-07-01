import { z } from 'zod';

export const refreshTokensParamSchema = z.object({
  refreshToken: z.jwt(),
});

export type RefreshTokensParam = z.infer<typeof refreshTokensParamSchema>;
