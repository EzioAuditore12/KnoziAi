import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatAskQuestionApi } from '../api/chat-ask-question.api';

export function useChatAskQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatAskQuestionApi,
    onSuccess: () => {
      // TODO: Implement SSE streaming or job polling here to fetch live response chunks
      // from the API instead of just invalidating queries.
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      alert(error);
    },
  });
}
