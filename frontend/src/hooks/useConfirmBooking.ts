import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmBookingApi } from '../api/bookings';

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reservationId }: { reservationId: string }) =>
      confirmBookingApi({ reservationId }),
    onSuccess: () => {
      // Invalidate both lists and details since seats have shifted status
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export default useConfirmBooking;
