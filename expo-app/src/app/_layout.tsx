import '../../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { TanstackReactQueryClientProvider } from '@/lib/tanstack/react-query';
import { NAV_THEME } from '@/lib/theme';
import { useColorScheme } from '../lib/use-color-scheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme === 'dark' ? 'dark' : 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardProvider>
        <TanstackReactQueryClientProvider>
          <Stack initialRouteName="(main)" screenOptions={{ headerShown: false }} />
        </TanstackReactQueryClientProvider>
      </KeyboardProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
