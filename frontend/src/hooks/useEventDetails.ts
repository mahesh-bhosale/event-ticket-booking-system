import { useQuery } from '@tanstack/react-query';
import { getEventApi } from '../api/events';
import { queryKeys } from '../constants/queryKeys';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAppToast } from './useAppToast';
import { Seat } from '../types/seat.types';

export function useEventDetails(eventId: string, hasActiveReservation: boolean = false) {
  const toast = useAppToast();

  const query = useQuery({
    queryKey: queryKeys.event(eventId),
    queryFn: async () => {
      try {
        const response = await getEventApi(eventId);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch event details');
        }
        return response;
      } catch (err) {
        const errMsg = getApiErrorMessage(err);
        toast.error(errMsg);
        throw new Error(errMsg);
      }
    },
    enabled: !!eventId,
    // Poll every 30 seconds only if there's no active reservation hold
    refetchInterval: hasActiveReservation ? false : 30000,
    staleTime: 10000,
  });

  return {
    event: query.data?.data?.event ?? null,
    seats: (query.data?.data?.seats as unknown as Seat[]) ?? [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export default useEventDetails;
