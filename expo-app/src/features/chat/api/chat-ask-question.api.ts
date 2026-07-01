import { authenticatedTypedFetch } from '@/lib/auth-fetch';
import { ChatAskQuestionParam } from '../schemas/ask-question/param.schema';
import { chatAskQuestionResponseSchema } from '../schemas/ask-question/response.schema';

export const chatAskQuestionApi = async (data: ChatAskQuestionParam) => {
  return await authenticatedTypedFetch({
    url: 'chat/ask',
    method: 'POST',
    body: data,
    schema: chatAskQuestionResponseSchema,
  });
};
