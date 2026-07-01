import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/auth';

export default function MainScreensLayout() {
  const { user } = useAuthStore((state) => state);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ title: 'Home Screen' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}
