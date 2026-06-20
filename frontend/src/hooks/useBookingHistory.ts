import { useQuery } from '@tanstack/react-query';
import { getBookingHistory } from '../api/bookingHistory';
import { queryKeys } from '../constants/queryKeys';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAppToast } from './useAppToast';
import type { BookingHistoryQuery } from '../types/bookingHistory.types';

/**
 * Hook to retrieve and cache booking history.
 * Supports pagination, search term, and time filter query parameters.
 */
export function useBookingHistory(filters: BookingHistoryQuery = {}) {
  const toast = useAppToast();

  const query = useQuery({
    queryKey: queryKeys.bookingHistory(filters),
    queryFn: async () => {
      try {
        const response = await getBookingHistory(filters);
        return response;
      } catch (err) {
        const errMsg = getApiErrorMessage(err);
        toast.error(errMsg);
        throw new Error(errMsg);
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 30000, // 30 seconds query caching
    retry: 1,
  });

  return {
    bookings: query.data?.bookings ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

export default useBookingHistory;
