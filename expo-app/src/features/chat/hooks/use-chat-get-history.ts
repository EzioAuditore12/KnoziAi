import { useInfiniteQuery } from '@tanstack/react-query';

import { PaginationParam } from '@/features/common/schemas/pagination/param.schema';
import { getChatGetHistoryApi } from '../api/chat-get-history.api';

export const USE_GET_CHAT_HISTORY_KEY = 'chat-history';

export function useChatGetHistory({ limit, page }: PaginationParam) {
  return useInfiniteQuery({
    queryKey: [USE_GET_CHAT_HISTORY_KEY, limit, page],
    queryFn: ({ pageParam }) => getChatGetHistoryApi({ limit, page: pageParam as number }),
    initialPageParam: page,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),
  });
}
