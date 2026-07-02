import { env } from '@/env';
import { typedFetch } from '../../../../../lib/fetch';
import type { RegisterParam } from '../schemas/param.schema';
import { registerResponseSchema } from '../schemas/response.schema';

export const registerFormApi = async (data: RegisterParam) => {
  return await typedFetch({
    url: `${env.API_URL}/auth/register`,
    method: 'POST',
    body: data,
    schema: registerResponseSchema,
  });
};
