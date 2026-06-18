import { useQuery } from '@tanstack/react-query';
import { getEventsApi } from '../api/events';
import { queryKeys } from '../constants/queryKeys';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAppToast } from './useAppToast';

export function useEventList(page: number = 1, limit?: number, date?: string) {
  const toast = useAppToast();

  const query = useQuery({
    queryKey: queryKeys.eventList(page),
    queryFn: async () => {
      try {
        const response = await getEventsApi({ page, limit, date });
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch events');
        }
        return response;
      } catch (err) {
        const errMsg = getApiErrorMessage(err);
        toast.error(errMsg);
        throw new Error(errMsg);
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 30000,
    retry: 2,
  });

  return {
    events: query.data?.data?.events ?? [],
    pagination: query.data?.meta ?? null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export default useEventList;
