import { authenticatedTypedFetch } from '../../../lib/auth-fetch';
import { userSchema } from '../schemas/user.schema';

export const getProfileApi = async () => {
  return await authenticatedTypedFetch({
    url: 'user/me',
    method: 'GET',
    schema: userSchema,
  });
};
