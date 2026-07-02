import { isStrongPassword } from 'validator';
import { z } from 'zod';

export const registerParamSchema = z.object({
  name: z.string().max(50),
  email: z.email(),
  password: z.string().refine(
    (val) =>
      isStrongPassword(val, {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
        minSymbols: 1,
      }),
    {
      message:
        'Password must be at least 8 characters long, and include at least one lowercase letter, one uppercase letter, one number, and one symbol.',
    }
  ),
});

export type RegisterParam = z.infer<typeof registerParamSchema>;
