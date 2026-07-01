import { z } from 'zod';

export const paginationResponseSchema = z.object({
  totalDocs: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  page: z.number(),
  pagingCounter: z.number(),
  hasPrevPage: z.boolean(),
  hasNextPage: z.boolean(),
  prevPage: z.number().nullable(),
  nextPage: z.number().nullable(),
});

export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
