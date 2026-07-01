import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/auth';

export default function AuthScreensLayout() {
  const { user } = useAuthStore((state) => state);

  if (user) return <Redirect href="/(main)" />;

  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="register"
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
