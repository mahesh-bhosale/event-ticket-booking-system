import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reserveSeatsApi } from '../api/reservations';
import type { ApiResponse } from '../types/index';
import type { EventDetailsResult } from '../types/event.types';

export function useReserveSeats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      seatNumbers,
      idempotencyKey,
    }: {
      eventId: string;
      seatNumbers: string[];
      idempotencyKey: string;
    }) => reserveSeatsApi({ eventId, seatNumbers }, idempotencyKey),

    onMutate: async ({ eventId, seatNumbers }) => {
      const queryKey = ['event', eventId];
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousEventDetails = queryClient.getQueryData<ApiResponse<EventDetailsResult>>(queryKey);

      // Optimistically update to the new value
      if (previousEventDetails?.success && previousEventDetails.data) {
        const updatedSeats = previousEventDetails.data.seats.map((seat) => {
          if (seatNumbers.includes(seat.seatNumber)) {
            return { ...seat, status: 'reserved' as const };
          }
          return seat;
        });

        queryClient.setQueryData<ApiResponse<EventDetailsResult>>(queryKey, {
          ...previousEventDetails,
          data: {
            ...previousEventDetails.data,
            seats: updatedSeats,
          },
        });
      }

      // Return a context object with the snapshotted value
      return { previousEventDetails, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousEventDetails) {
        queryClient.setQueryData(context.queryKey, context.previousEventDetails);
      }
    },

    onSuccess: (_data, variables) => {
      // Invalidate the event detail query to get fresh server state
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      // Invalidate lists too since available seat count changes
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export default useReserveSeats;
