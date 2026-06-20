import axiosClient from './client';
import type { BookingHistoryQuery, BookingHistoryResponse } from '../types/bookingHistory.types';

/**
 * Fetches the paginated booking history for the current authenticated user.
 */
export const getBookingHistory = async (
  params?: BookingHistoryQuery
): Promise<BookingHistoryResponse> => {
  const response = await axiosClient.get('/bookings/history', { params });
  return response.data.data;
};
