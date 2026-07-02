import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/native-link';
import { Text } from '@/components/ui/text';
import { RegisterForm } from '@/features/auth/local/register/components/form';
import { useRegisterForm } from '@/features/auth/local/register/hooks/use-register-form';

export default function RegisterScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  const { mutateAsync, isPending } = useRegisterForm();

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
      <Text variant={'h2'}>Create an Account</Text>

      <RegisterForm className="w-full max-w-4xl mt-4" handleSubmit={mutateAsync} isSubmitting={isPending} />

      <View className="mt-4 flex-row items-center gap-x-1">
        <Text variant={'muted'}>Already have an account?</Text>
        <Link href={'/login'}>Login</Link>
      </View>
    </KeyboardAwareScrollView>
  );
}
