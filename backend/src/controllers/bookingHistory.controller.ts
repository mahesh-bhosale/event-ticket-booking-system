import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { BookingHistoryService } from '../services/bookingHistory.service';
import type { AuthenticatedRequest } from '../types/reservation.types';
import type { BookingHistoryQuery } from '../types/bookingHistory.types';

/**
 * GET /api/bookings/history
 * Protected - Retrieves paginated, searchable booking history for the current authenticated user
 */
export const getBookingHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Since validation middleware has already parsed, validated, and type-cast the query,
    // we can safely cast and pass it to the service layer.
    const query = req.query as unknown as BookingHistoryQuery;

    const result = await BookingHistoryService.getBookingHistory(userId, query);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);
