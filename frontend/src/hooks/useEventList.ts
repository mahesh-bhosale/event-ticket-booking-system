import { useQuery } from '@tanstack/react-query';
import { getEventsApi } from '../api/events';
import { queryKeys } from '../constants/queryKeys';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAppToast } from './useAppToast';
import type { EventQueryFilters } from '../types/event.types';

export function useEventList(filters: EventQueryFilters = {}) {
  const toast = useAppToast();

  const query = useQuery({
    queryKey: queryKeys.eventList(filters),
    queryFn: async () => {
      try {
        const response = await getEventsApi(filters);
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
    pagination: query.data?.data?.pagination ?? null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export default useEventList;
