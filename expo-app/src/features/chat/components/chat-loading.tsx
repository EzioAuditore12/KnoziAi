import { View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

export function ChatLoading() {
  return (
    <View className="flex-1 justify-end gap-4 p-4 pb-10">
      {/* Sent message skeleton */}
      <View className="mt-4 flex-row items-end justify-end gap-2">
        <View className="items-end gap-1">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-br-none" />
          <Skeleton className="h-10 w-64 rounded-2xl rounded-br-none" />
        </View>
      </View>

      {/* Received message skeleton */}
      <View className="mt-4 flex-row items-end gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <View className="gap-1">
          <Skeleton className="h-10 w-56 rounded-2xl rounded-bl-none" />
          <Skeleton className="h-10 w-40 rounded-2xl rounded-bl-none" />
        </View>
      </View>

      {/* Sent message skeleton */}
      <View className="mt-4 flex-row items-end justify-end gap-2">
        <View className="items-end gap-1">
          <Skeleton className="h-10 w-56 rounded-2xl rounded-br-none" />
        </View>
      </View>

      {/* Received message skeleton */}
      <View className="mt-4 flex-row items-end gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <View className="gap-1">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-none" />
        </View>
      </View>
    </View>
  );
}
