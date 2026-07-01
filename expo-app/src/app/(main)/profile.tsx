import { ScrollView } from 'react-native';

import { ProfileCard } from '@/features/common/components/profile-card';
import { useGetProfile } from '@/features/common/hooks/use-get-profile';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export default function ProfileScreen() {
  const { data, isLoading, refetch } = useGetProfile();

  useRefreshOnFocus(refetch);

  return (
    <ScrollView contentContainerClassName="flex-1 items-center justify-center p-4">
      <ProfileCard user={data} isLoading={isLoading} />
    </ScrollView>
  );
}
