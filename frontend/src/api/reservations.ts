import apiClient from './client';
import type { ApiResponse } from '../types/index';
import type { ReservationResult } from '../types/event.types';

export async function reserveSeatsApi(
  payload: { eventId: string; seatNumbers: string[] },
  idempotencyKey: string
): Promise<ApiResponse<ReservationResult>> {
  const response = await apiClient.post<ApiResponse<ReservationResult>>('/reserve', payload, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data;
}
