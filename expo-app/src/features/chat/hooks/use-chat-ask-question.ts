import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatAskQuestionApi } from '../api/chat-ask-question.api';

export function useChatAskQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatAskQuestionApi,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      alert(error);
    },
  });
}
