import { View } from 'react-native';

import { Link } from '@/components/native-link';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/store/auth';

export default function HomeScreen() {
  const { logout, user } = useAuthStore();

  return (
    <View className="flex-1 items-center justify-center gap-y-2">
      <Text variant="h2">Hello {user?.name}</Text>

      <Button onPress={logout} variant={'destructive'}>
        <Text>Logout</Text>
      </Button>

      <Link href={'/profile'}>Go To Profile</Link>

      <Link href={'/chat'}>Go To Chat</Link>
    </View>
  );
}
