import { IMessage } from '@kesha-antonov/react-native-chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useChatAskQuestion } from '@/features/chat/hooks/use-chat-ask-question';
import { useChatGetHistory } from '@/features/chat/hooks/use-chat-get-history';
import { ChatMessage } from '@/features/chat/schemas/chat-message.schema';
import { authenticatedStreamingSseFetch } from '../../../lib/auth-fetch/stream';

// Helper to convert ChatMessage to IMessage for the Chat component
export const toIMessage = (msg: ChatMessage): IMessage => ({
  _id: msg.id,
  text: msg.content,
  createdAt: new Date(msg.createdAt),
  user: {
    _id: msg.role === 'USER' ? 1 : 2,
    name: msg.role === 'USER' ? 'Me' : 'Assistant',
  },
});

export function useChatMessages() {
  const queryClient = useQueryClient();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatGetHistory({
    limit: 20,
    page: 1,
  });
  const { mutateAsync: askQuestion, isPending } = useChatAskQuestion();

  // State for optimistically added messages
  const [pendingMessages, setPendingMessages] = useState<IMessage[]>([]);

  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setPendingMessages([]);
  }

  // Memoize mapped messages to prevent unnecessary re-renders
  const displayMessages = useMemo(() => {
    let remoteMessages: IMessage[] = [];
    if (data) {
      const allDocs = data.pages.flatMap((page) => page.docs);
      remoteMessages = allDocs.map(toIMessage);
    }
    // Prepend pending messages so they show at the bottom (newest first)
    return [...pendingMessages, ...remoteMessages];
  }, [data, pendingMessages]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text;
      if (!text) return;

      const aiTempId = `temp-ai-${Date.now()}`;
      const tempAiMessage: IMessage = {
        _id: aiTempId,
        text: '',
        createdAt: new Date(),
        user: { _id: 2, name: 'Assistant' },
      };

      // Optimistically add to UI
      setPendingMessages((prev) => [tempAiMessage, ...newMessages, ...prev]);

      try {
        // Call mutation and get the response containing chatId
        const response = await askQuestion({ question: text });

        if (response?.chatId) {
          const stream = authenticatedStreamingSseFetch({
            url: `chat/stream/${response.chatId}`,
            method: 'GET',
          });

          for await (const chunk of stream) {
            setPendingMessages((prev) =>
              prev.map((msg) => (msg._id === aiTempId ? { ...msg, text: msg.text + chunk } : msg))
            );
          }
        }
      } catch (error) {
        console.error('Error during chat stream:', error);
      } finally {
        queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      }
    },
    [askQuestion, queryClient]
  );

  return {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    displayMessages,
    onSend,
  };
}
