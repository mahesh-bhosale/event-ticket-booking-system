import mongoose, { Types } from 'mongoose';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { Seat, SeatStatus } from '../models/Seat';

export interface CleanupOptions {
  eventId?: Types.ObjectId | string;
  session?: mongoose.ClientSession;
}

export interface CleanupResult {
  expiredReservationsProcessed: number;
  seatsReleased: number;
}

/**
 * Automatically releases seats locked under expired ACTIVE reservations and
 * transitions the reservation status to EXPIRED.
 * 
 * Safe to call multiple times, idempotent, and compatible with MongoDB sessions.
 */
export async function cleanupExpiredReservations(
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const { eventId, session } = options;
  const now = new Date();

  // Find ACTIVE reservations that have expired.
  // Optional eventId filtering enables event-scoped cleanup optimizations.
  const query: {
    status: ReservationStatus;
    expiresAt: { $lt: Date };
    eventId?: Types.ObjectId;
  } = {
    status: ReservationStatus.ACTIVE,
    expiresAt: { $lt: now },
  };

  if (eventId) {
    query.eventId = typeof eventId === 'string' ? new Types.ObjectId(eventId) : eventId;
  }

  // Retrieve matching reservation IDs. Using select('_id') keeps memory usage minimal.
  const expiredReservations = await Reservation.find(query)
    .select('_id')
    .session(session ?? null)
    .lean();

  const expiredReservationIds = expiredReservations.map((r) => r._id);

  if (expiredReservationIds.length === 0) {
    return {
      expiredReservationsProcessed: 0,
      seatsReleased: 0,
    };
  }

  // 1. Release reserved seats back to AVAILABLE.
  // Conditions: Seat is RESERVED and linked to one of the expired reservations.
  const seatUpdateResult = await Seat.updateMany(
    {
      reservationId: { $in: expiredReservationIds },
      status: SeatStatus.RESERVED,
    },
    {
      $set: {
        status: SeatStatus.AVAILABLE,
        reservedBy: null,
        reservedAt: null,
        reservationId: null,
      },
    },
    { session }
  );

  // 2. Transition Reservation status from ACTIVE to EXPIRED.
  await Reservation.updateMany(
    {
      _id: { $in: expiredReservationIds },
    },
    {
      $set: { status: ReservationStatus.EXPIRED },
    },
    { session }
  );

  return {
    expiredReservationsProcessed: expiredReservationIds.length,
    seatsReleased: seatUpdateResult.modifiedCount,
  };
}
