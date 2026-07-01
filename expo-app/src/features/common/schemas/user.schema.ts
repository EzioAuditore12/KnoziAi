import { z } from 'zod';

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
  emailVerified: z.boolean(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;
