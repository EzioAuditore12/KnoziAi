import { z } from 'zod';

import { tokensSchema } from '@/features/common/schemas/tokens.schema';
import { userSchema } from '@/features/common/schemas/user.schema';

export const registerResponseSchema = z.object({
  user: userSchema,
  tokens: tokensSchema,
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
