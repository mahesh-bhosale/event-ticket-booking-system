import apiClient from './client';
import type { ApiResponse } from '../types/index';
import type { BookingConfirmResult } from '../types/event.types';

export async function confirmBookingApi(payload: {
  reservationId: string;
}): Promise<ApiResponse<BookingConfirmResult>> {
  const response = await apiClient.post<ApiResponse<BookingConfirmResult>>('/bookings', payload);
  return response.data;
}
