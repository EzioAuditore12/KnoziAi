import { View } from 'react-native';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { User } from '@/features/common/schemas/user.schema';

export type ProfileCardProps = {
  user?: User | null;
  isLoading?: boolean;
};

export function ProfileCard({ user, isLoading }: ProfileCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-6">
          <Text className="text-muted-foreground text-center">User not found</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="muted">Role</Text>
          <Text>{user.role}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text variant="muted">Email Verified</Text>
          <Text>{user.emailVerified ? 'Yes' : 'No'}</Text>
        </View>
      </CardContent>
    </Card>
  );
}
