import { z } from 'zod';

import { tokensSchema } from '@/features/common/schemas/tokens.schema';

export const refreshTokensResponseSchema = tokensSchema;

export type RefreshTokensResponse = z.infer<typeof refreshTokensResponseSchema>;
