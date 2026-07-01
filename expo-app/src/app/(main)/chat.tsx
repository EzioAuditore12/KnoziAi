import { Chat, IMessage } from '@kesha-antonov/react-native-chat';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatLoading } from '@/features/chat/components/chat-loading';
import { useChatAskQuestion } from '@/features/chat/hooks/use-chat-ask-question';
import { useChatGetHistory } from '@/features/chat/hooks/use-chat-get-history';
import { ChatMessage } from '@/features/chat/schemas/chat-message.schema';

// Helper to convert ChatMessage to IMessage for the Chat component
const toIMessage = (msg: ChatMessage): IMessage => ({
  _id: msg.id,
  text: msg.content,
  createdAt: new Date(msg.createdAt),
  user: {
    _id: msg.role === 'USER' ? 1 : 2,
    name: msg.role === 'USER' ? 'Me' : 'Assistant',
  },
});

export default function Example() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatGetHistory({
    limit: 20,
    page: 1,
  });
  const { mutate: askQuestion, isPending } = useChatAskQuestion();

  // keyboardVerticalOffset = distance from screen top to Chat container
  // useHeaderHeight() returns status bar + navigation header height
  const headerHeight = useHeaderHeight();

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

  if (isLoading && !data) {
    return <ChatLoading />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <Chat
        messages={displayMessages}
        onSend={(newMessages) => onSend(newMessages)}
        user={{
          _id: 1, // Local user is 'USER' role
        }}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
        loadEarlierMessagesProps={{
          isAvailable: hasNextPage,
          onPress: fetchNextPage,
          isLoading: isFetchingNextPage,
        }}
        isTyping={isPending}
      />
    </SafeAreaView>
  );
}
