import { PaginationParam } from '@/features/common/schemas/pagination/param.schema';
import { authenticatedTypedFetch } from '@/lib/auth-fetch';
import { chatHistorySchema } from '../schemas/chat-histories.schema';

export const getChatGetHistoryApi = async (data: PaginationParam) => {
  return await authenticatedTypedFetch({
    url: 'chat/history',
    method: 'GET',
    query: data,
    schema: chatHistorySchema,
  });
};
