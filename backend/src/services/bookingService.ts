import mongoose, { Types } from 'mongoose';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { Seat } from '../models/Seat';
import { SeatStatus } from '../types/seat.types';
import { ApiError } from '../utils/ApiError';
import { generateBookingReference } from '../utils/generateBookingReference';
import type { ConfirmBookingResult } from '../types/booking.types';
import type { EventDocument } from '../models/Event';

export class BookingService {
  /**
   * Confirms a seat reservation, converts seats from RESERVED to BOOKED status,
   * updates reservation status to COMPLETED, and generates a unique booking reference.
   * Executed atomically inside a MongoDB transaction.
   */
  public static async confirmBooking(
    userIdStr: string,
    reservationIdStr: string,
  ): Promise<ConfirmBookingResult> {
    // Validate reservationId format to prevent CastError
    if (!mongoose.isValidObjectId(reservationIdStr)) {
      throw ApiError.badRequest('Invalid reservation id');
    }

    const userId = new Types.ObjectId(userIdStr);
    const reservationId = new Types.ObjectId(reservationIdStr);

    let attempts = 0;
    const maxAttempts = 5;

    while (true) {
      attempts++;
      const session = await mongoose.startSession();
      session.startTransaction();
      let transactionCommitted = false;

      try {
        // ── Step 1: Find reservation and verify ownership ──────────
        // Requirement: User must own the reservation. If reservation belongs
        // to another user or doesn't exist, return 403 Forbidden.
        const reservation = await Reservation.findById(reservationId)
          .session(session)
          .populate('eventId');

        if (!reservation || reservation.userId.toString() !== userId.toString()) {
          throw new ApiError(403, 'Reservation does not belong to current user');
        }

        // ── Step 2: Validate reservation status ────────────────────
        if (reservation.status === ReservationStatus.COMPLETED) {
          throw ApiError.conflict('Reservation already confirmed');
        }
        if (reservation.status === ReservationStatus.CANCELLED) {
          throw ApiError.conflict('Reservation already cancelled');
        }
        if (reservation.status === ReservationStatus.EXPIRED) {
          throw new ApiError(410, 'Reservation expired');
        }

        // ── Step 3: Validate expiration ────────────────────────────
        const currentTime = new Date();
        if (reservation.expiresAt <= currentTime) {
          // Release the seats back to AVAILABLE since reservation has expired
          await Seat.updateMany(
            {
              _id: { $in: reservation.seatIds },
              status: SeatStatus.RESERVED,
            },
            {
              $set: {
                status: SeatStatus.AVAILABLE,
                reservedBy: null,
                reservedAt: null,
              },
            },
            { session },
          );

          reservation.status = ReservationStatus.EXPIRED;
          await reservation.save({ session });

          transactionCommitted = true;
          await session.commitTransaction();

          throw new ApiError(410, 'Reservation expired');
        }

        // ── Step 4: Verify Seat Integrity ──────────────────────────
        // Fetch all seats and confirm status = RESERVED
        const seats = await Seat.find({ _id: { $in: reservation.seatIds } })
          .session(session)
          .lean();

        const hasInconsistency =
          seats.length !== reservation.seatIds.length ||
          seats.some((seat) => seat.status !== SeatStatus.RESERVED);

        if (hasInconsistency) {
          throw ApiError.internal('Seat state inconsistency detected');
        }

        // ── Step 5: Generate Booking Reference ──────────────────────
        const bookingReference = await generateBookingReference(session);

        // ── Step 6: Convert Seats To Booked ─────────────────────────
        const updateSeatsResult = await Seat.updateMany(
          {
            _id: { $in: reservation.seatIds },
            status: SeatStatus.RESERVED,
          },
          {
            $set: {
              status: SeatStatus.BOOKED,
              reservedBy: null,
              reservedAt: null,
              reservationId: null,
            },
          },
          { session },
        );

        // Seat integrity check: verify modification matches expectation
        if (updateSeatsResult.modifiedCount !== reservation.seatIds.length) {
          throw ApiError.internal('Failed to book all seats');
        }

        // ── Step 7: Update Reservation ──────────────────────────────
        const bookedAt = new Date();
        reservation.status = ReservationStatus.COMPLETED;
        reservation.bookingReference = bookingReference;
        reservation.bookedAt = bookedAt;
        await reservation.save({ session });

        // ── Step 8: Commit Transaction ─────────────────────────────
        transactionCommitted = true;
        await session.commitTransaction();

        // Extract details from populated Event document
        const eventDoc = reservation.eventId as unknown as EventDocument;

        return {
          bookingId: reservation._id.toString(),
          bookingReference,
          eventName: eventDoc.name,
          venue: eventDoc.venue,
          eventDate: eventDoc.dateTime,
          seatNumbers: reservation.seatNumbers,
          bookedAt,
        };
      } catch (error: any) {
        // Rollback database changes on failure if not committed
        if (!transactionCommitted) {
          await session.abortTransaction();
        }

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
export default BookingService;
