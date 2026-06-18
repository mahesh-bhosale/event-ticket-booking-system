import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { BookingService } from '../services/bookingService';
import type { AuthenticatedRequest } from '../types/reservation.types';

/**
 * POST /api/bookings
 * Protected - Confirm an active seat reservation
 */
export const confirmBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { reservationId } = req.body as { reservationId: string };

    // Delegate execution to transactional service layer
    const result = await BookingService.confirmBooking(userId, reservationId);

    res
      .status(200)
      .json(ApiResponse.ok('Booking confirmed successfully', result));
  },
);
