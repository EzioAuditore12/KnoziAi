import { z } from 'zod';

export const paginationParamSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type PaginationParam = z.infer<typeof paginationParamSchema>;
