import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/native-link';
import { Text } from '@/components/ui/text';
import { LoginForm } from '@/features/auth/local/login/components/form';
import { useLoginForm } from '@/features/auth/local/login/hooks/mutations/use-login-form';

export default function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  const { mutateAsync, isPending } = useLoginForm();

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        flexGrow: 1,
      }}
      contentContainerClassName="px-2 justify-center items-center"
      bottomOffset={100}
    >
      <Text variant={'h2'}>Welcome Back!</Text>

      <LoginForm className="w-full max-w-4xl" handleSubmit={mutateAsync} isSubmitting={isPending} />

      <View className="mt-4 flex-row items-center gap-x-1">
        <Text variant={'muted'}>Don&apos;t have an account?</Text>
        <Link href={'/register'}>Register</Link>
      </View>
    </KeyboardAwareScrollView>
  );
}
