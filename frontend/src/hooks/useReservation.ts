import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reserveSeatsApi } from '../api/reservations';
import { confirmBookingApi } from '../api/bookings';
import { queryKeys } from '../constants/queryKeys';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAppToast } from './useAppToast';
import { ReservationData } from '../types/reservation.types';
import { SeatStatus } from '../types/seat.types';
import type { ApiResponse } from '../types/index';
import type { EventDetailsResult } from '../types/event.types';

const RESERVATION_STORAGE_KEY = 'sortmyscene_reservation';

export function useReservation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useAppToast();

  const [reservation, setReservation] = useState<ReservationData | null>(() => {
    const stored = sessionStorage.getItem(RESERVATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReservationData;
        // Check if preserved reservation is already expired
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          return parsed;
        }
        sessionStorage.removeItem(RESERVATION_STORAGE_KEY);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Clear reservation state (on cancel or hold timeout)
  const clearReservation = useCallback((expired: boolean = true) => {
    const eventId = reservation?.eventId;
    setReservation(null);
    setIsExpired(expired);
    sessionStorage.removeItem(RESERVATION_STORAGE_KEY);

    // Invalidate cached seat details to unlock layout
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.events });
  }, [reservation, queryClient]);

  const resetExpired = useCallback(() => {
    setIsExpired(false);
  }, []);

  // Reservation hold mutation with Optimistic UI updates
  const reserveMutation = useMutation({
    mutationFn: async ({
      eventId,
      seatNumbers,
      idempotencyKey,
    }: {
      eventId: string;
      seatNumbers: string[];
      idempotencyKey: string;
    }) => {
      try {
        const res = await reserveSeatsApi({ eventId, seatNumbers }, idempotencyKey);
        if (!res.success) {
          throw new Error(res.message);
        }
        return res;
      } catch (err) {
        throw new Error(getApiErrorMessage(err));
      }
    },

    onMutate: async ({ eventId, seatNumbers }) => {
      const queryKey = queryKeys.event(eventId);
      // Cancel outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot existing cache data
      const previousEventDetails = queryClient.getQueryData<ApiResponse<EventDetailsResult>>(queryKey);

      // Optimistically update status to RESERVED in the React Query cache
      if (previousEventDetails?.success && previousEventDetails.data) {
        const updatedSeats = previousEventDetails.data.seats.map((seat) => {
          if (seatNumbers.includes(seat.seatNumber)) {
            // Map strictly to SeatStatus enum
            return { ...seat, status: SeatStatus.RESERVED };
          }
          return seat;
        });

        queryClient.setQueryData<ApiResponse<EventDetailsResult>>(queryKey, {
          ...previousEventDetails,
          data: {
            ...previousEventDetails.data,
            seats: updatedSeats as any, // Cast to any to align Mongoose/JSON status strings securely
          },
        });
      }

      return { previousEventDetails, queryKey };
    },

    onError: (err, _variables, context) => {
      // Rollback to snapshotted state on error
      if (context?.previousEventDetails) {
        queryClient.setQueryData(context.queryKey, context.previousEventDetails);
      }
      toast.error(err.message);
    },

    onSuccess: (res, variables) => {
      if (res.data) {
        const resData: ReservationData = {
          reservationId: res.data.reservationId,
          expiresAt: res.data.expiresAt,
          seatNumbers: variables.seatNumbers,
          eventId: variables.eventId,
        };

        setReservation(resData);
        setIsExpired(false);
        sessionStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(resData));
        toast.success('Seats reserved successfully');
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });

  // Booking confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      try {
        const res = await confirmBookingApi({ reservationId });
        if (!res.success) {
          throw new Error(res.message);
        }
        return res;
      } catch (err) {
        throw new Error(getApiErrorMessage(err));
      }
    },

    onError: (err) => {
      toast.error(err.message);
    },

    onSuccess: (res) => {
      setReservation(null);
      setIsExpired(false);
      sessionStorage.removeItem(RESERVATION_STORAGE_KEY);

      if (reservation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.event(reservation.eventId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.events });

      navigate('/booking/success', {
        state: { booking: res.data },
        replace: true,
      });
    },
  });

  const reserveSeats = useCallback(
    (eventId: string, seatNumbers: string[], idempotencyKey: string) => {
      return reserveMutation.mutateAsync({ eventId, seatNumbers, idempotencyKey });
    },
    [reserveMutation]
  );

  const confirmBooking = useCallback(
    (reservationId: string) => {
      return confirmMutation.mutateAsync(reservationId);
    },
    [confirmMutation]
  );

  const isLoading = reserveMutation.isPending || confirmMutation.isPending;
  const error = reserveMutation.error?.message || confirmMutation.error?.message || null;

  return {
    reservation,
    reserveSeats,
    confirmBooking,
    clearReservation,
    resetExpired,
    isExpired,
    isLoading,
    error,
  };
}

export default useReservation;
