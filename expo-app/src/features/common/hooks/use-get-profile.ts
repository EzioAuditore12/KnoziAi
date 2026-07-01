import { useQuery } from '@tanstack/react-query';

import { getProfileApi } from '../api/get-profile.api';

export const USE_GET_PROFILE_API_KEY = 'profile';

export function useGetProfile() {
  return useQuery({
    queryKey: [USE_GET_PROFILE_API_KEY],
    queryFn: getProfileApi,
  });
}
