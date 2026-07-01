import { Chat } from '@kesha-antonov/react-native-chat';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatLoading } from '@/features/chat/components/chat-loading';
import { useChatMessages } from '@/features/chat/hooks/use-chat-messages';
import { View } from 'react-native';

export default function ChattingScreen() {
  // keyboardVerticalOffset = distance from screen top to Chat container
  // useHeaderHeight() returns status bar + navigation header height
  const headerHeight = useHeaderHeight();
  const safeAreaInsets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    displayMessages,
    onSend,
  } = useChatMessages();

  if (isLoading && !data) return <ChatLoading />;

  return (
    <View
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
      }}
      className="flex-1"
    >
      <Chat
        messages={displayMessages}
        onSend={(newMessages) => onSend(newMessages)}
        user={{
          _id: 1, // Local user is 'USER' role
        }}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight + safeAreaInsets.top }}
        loadEarlierMessagesProps={{
          isAvailable: hasNextPage,
          onPress: fetchNextPage,
          isLoading: isFetchingNextPage,
        }}
        isTyping={isPending}
      />
    </View>
  );
}
