import { z } from 'zod';

export const loginParamSchema = z.object({
  email: z.email(),
  password: z.string().nonempty().max(16),
});

export type LoginParam = z.infer<typeof loginParamSchema>;
