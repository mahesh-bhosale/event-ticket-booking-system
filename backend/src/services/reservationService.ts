import mongoose, { Types } from 'mongoose';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { SeatStatus } from '../types/seat.types';
import { ApiError } from '../utils/ApiError';
import type { ReserveSeatsResult } from '../types/reservation.types';

// ─────────────────────────────────────────────────────────────
//  Custom Conflict Error Class
// ─────────────────────────────────────────────────────────────

export class SeatReservationError extends ApiError {
  public readonly unavailableSeats: string[];

  constructor(unavailableSeats: string[]) {
    super(409, 'Some seats are no longer available', unavailableSeats);
    this.name = 'SeatReservationError';
    this.unavailableSeats = unavailableSeats;
  }
}

// ─────────────────────────────────────────────────────────────
//  Service Implementation
// ─────────────────────────────────────────────────────────────

export class ReservationService {
  /**
   * Reserves a set of seats for a user and event using MongoDB transactions.
   * Ensures atomic updates and optimistic concurrency control.
   */
  public static async reserveSeats(
    userIdStr: string,
    eventIdStr: string,
    seatNumbers: string[],
  ): Promise<ReserveSeatsResult> {
    const userId = new Types.ObjectId(userIdStr);
    const eventId = new Types.ObjectId(eventIdStr);

    let attempts = 0;
    const maxAttempts = 5;

    while (true) {
      attempts++;
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // ── Step 1: Validate event exists and is active ──────────
        const event = await Event.findById(eventId).session(session).lean();
        if (!event) {
          throw ApiError.notFound('Event not found');
        }
        if (!event.isActive) {
          throw new ApiError(410, 'Event is no longer available');
        }

        // ── Step 2: Check active reservation for same user/event ─
        const activeReservation = await Reservation.findOne({
          userId,
          eventId,
          status: ReservationStatus.ACTIVE,
        })
          .session(session)
          .lean();

        if (activeReservation) {
          throw ApiError.conflict('You already have an active reservation for this event');
        }

        // ── Step 3: Atomically reserve seats ─────────────────────
        const unavailableSeats: string[] = [];
        const seatIds: Types.ObjectId[] = [];

        for (const seatNumber of seatNumbers) {
          // Atomic findOneAndUpdate ensures concurrency protection using explicit $set
          const updatedSeat = await Seat.findOneAndUpdate(
            {
              eventId,
              seatNumber,
              status: SeatStatus.AVAILABLE,
            },
            {
              $set: {
                status: SeatStatus.RESERVED,
                reservedBy: userId,
                reservedAt: new Date(),
              },
            },
            { session, new: true },
          );

          if (!updatedSeat) {
            unavailableSeats.push(seatNumber);
          } else {
            seatIds.push(updatedSeat._id as Types.ObjectId);
          }
        }

        // Verify: updated seats length matches requested seats length
        if (seatIds.length !== seatNumbers.length) {
          throw new SeatReservationError(unavailableSeats);
        }

        // ── Step 4: Create Reservation document ──────────────────
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        const reservationDocs = await Reservation.create(
          [
            {
              userId,
              eventId,
              seatIds,
              seatNumbers,
              status: ReservationStatus.ACTIVE,
              expiresAt,
            },
          ],
          { session },
        );

        const reservation = reservationDocs[0];
        if (!reservation) {
          throw ApiError.internal('Failed to create reservation document');
        }

        // ── Step 5: Commit Transaction ───────────────────────────
        await session.commitTransaction();

        return {
          reservationId: reservation._id.toString(),
          seatNumbers: reservation.seatNumbers,
          expiresAt: reservation.expiresAt,
          expiresInSeconds: 600,
        };
      } catch (error: any) {
        // Rollback transaction changes on this attempt
        await session.abortTransaction();

        // Check for retryable MongoDB WriteConflict or TransientTransactionError
        const isTransient =
          error.errorLabels?.includes('TransientTransactionError') || error.code === 112;

        if (isTransient && attempts < maxAttempts) {
          // Stagger retries with random backoff (50ms - 150ms) to reduce collisions
          await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
          await session.endSession();
          continue;
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }
  }
}
