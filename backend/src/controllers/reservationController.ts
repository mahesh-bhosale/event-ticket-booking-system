import type { Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { IdempotencyKey } from '../models/IdempotencyKey';
import { ReservationService, SeatReservationError } from '../services/reservationService';
import type { AuthenticatedRequest } from '../types/reservation.types';

/**
 * POST /api/reserve
 * Protected - Reserve 1-8 seats for an event
 */
export const reserveSeats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    // 1. Read and validate Idempotency-Key header
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw ApiError.badRequest('Idempotency-Key header is required');
    }

    const { eventId, seatNumbers } = req.body as { eventId: string; seatNumbers: string[] };

    // 2. Generate request hash (incorporating userId, endpoint, and payload content)
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ userId, endpoint: req.originalUrl, body: { eventId, seatNumbers } }))
      .digest('hex');

    // 3. Try to acquire idempotency lock
    try {
      await IdempotencyKey.create({
        key: idempotencyKey,
        userId,
        endpoint: req.originalUrl,
        requestHash,
        responseBody: { status: 'PENDING' },
        statusCode: 202,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
      });
    } catch (err: any) {
      // Handle key unique index violation (11000)
      if (err.code === 11000) {
        const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });
        if (existingKey) {
          // Verify request hashes match
          if (existingKey.requestHash === requestHash) {
            // Check if key lock is still pending processing
            if (existingKey.statusCode === 202) {
              throw ApiError.conflict('Request is already being processed');
            }
            // Return cached response directly
            res.status(existingKey.statusCode).json(existingKey.responseBody);
            return;
          } else {
            throw ApiError.conflict('Idempotency key already used with different payload');
          }
        }
      }
      throw err;
    }

    // 4. Call Service Layer and capture results
    try {
      const result = await ReservationService.reserveSeats(userId, eventId, seatNumbers);

      const successResponse = {
        success: true,
        data: {
          reservationId: result.reservationId,
          seatNumbers: result.seatNumbers,
          expiresAt: result.expiresAt,
          expiresInSeconds: result.expiresInSeconds,
        },
      };

      // Update lock with success result
      await IdempotencyKey.updateOne(
        { key: idempotencyKey },
        {
          responseBody: successResponse,
          statusCode: 200,
        },
      );

      res.status(200).json(successResponse);
    } catch (err) {
      // Release lock on execution failure so client can retry
      await IdempotencyKey.deleteOne({ key: idempotencyKey });

      // Return requested shape on seat booking conflicts
      if (err instanceof SeatReservationError) {
        res.status(409).json({
          success: false,
          message: 'Some seats are no longer available',
          data: {
            unavailableSeats: err.unavailableSeats,
          },
        });
        return;
      }

      throw err;
    }
  },
);
