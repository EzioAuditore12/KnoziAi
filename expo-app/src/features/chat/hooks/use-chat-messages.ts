import { useCallback, useMemo, useState } from 'react';
import { IMessage } from '@kesha-antonov/react-native-chat';
import { useChatAskQuestion } from '@/features/chat/hooks/use-chat-ask-question';
import { useChatGetHistory } from '@/features/chat/hooks/use-chat-get-history';
import { ChatMessage } from '@/features/chat/schemas/chat-message.schema';

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
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatGetHistory({
    limit: 20,
    page: 1,
  });
  const { mutate: askQuestion, isPending } = useChatAskQuestion();

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
    (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text;
      if (!text) return;

      // Optimistically add to UI
      setPendingMessages((prev) => [...newMessages, ...prev]);

      // Call mutation
      askQuestion({ question: text });
    },
    [askQuestion]
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
