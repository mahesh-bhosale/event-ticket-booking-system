import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { ReservationStatus, type IReservation } from '../types/reservation.types';

// ─────────────────────────────────────────────────────────────
//  Document & Model Types
// ─────────────────────────────────────────────────────────────

/** Mongoose Document augmented with IReservation fields */
export type ReservationDocument = IReservation & Document;

/** Mongoose Model type for Reservation */
export type ReservationModel = Model<ReservationDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema Definition
// ─────────────────────────────────────────────────────────────
const reservationSchema = new Schema<ReservationDocument, ReservationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },

    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'eventId is required'],
    },

    seatNumbers: {
      type: [String],
      required: [true, 'seatNumbers is required'],
      validate: {
        validator(value: string[]): boolean {
          return value.length > 0;
        },
        message: 'seatNumbers must contain at least one seat',
      },
    },

    seatIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Seat',
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: Object.values(ReservationStatus),
        message: `Status must be one of: ${Object.values(ReservationStatus).join(', ')}`,
      },
      default: ReservationStatus.ACTIVE,
    },

    expiresAt: {
      type: Date,
      required: [true, 'expiresAt is required'],
      validate: {
        validator(this: ReservationDocument, value: Date): boolean {
          // Only validate future date on creation
          if (!this.isNew) return true;
          return value > new Date();
        },
        message: 'expiresAt must be a future date',
      },
    },

    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    bookedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Pre-Save Validation Hooks
// ─────────────────────────────────────────────────────────────

reservationSchema.pre('save', function (this: ReservationDocument, next) {
  // ── Rule 1: seatIds.length must equal seatNumbers.length ──
  if (this.seatIds.length !== this.seatNumbers.length) {
    next(
      new Error(
        `seatIds length (${this.seatIds.length}) must match seatNumbers length (${this.seatNumbers.length})`,
      ),
    );
    return;
  }

  // ── Rule 2: No duplicate seatNumbers ─────────────────────
  const uniqueSeatNumbers = new Set(this.seatNumbers);
  if (uniqueSeatNumbers.size !== this.seatNumbers.length) {
    next(new Error('Duplicate seat numbers are not allowed in a reservation'));
    return;
  }

  // ── Rule 3: No duplicate seatIds ─────────────────────────
  const seatIdStrings = (this.seatIds as Types.ObjectId[]).map((id) =>
    id.toString(),
  );
  const uniqueSeatIds = new Set(seatIdStrings);
  if (uniqueSeatIds.size !== seatIdStrings.length) {
    next(new Error('Duplicate seat IDs are not allowed in a reservation'));
    return;
  }

  next();
});

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────

/**
 * TTL Index — MongoDB automatically deletes expired reservations
 * when their expiresAt timestamp has passed (expireAfterSeconds: 0).
 */
reservationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'idx_reservation_expiresAt_ttl',
  },
);

/**
 * Partial Unique Index — Prevents a user from having more than one
 * ACTIVE reservation for the same event.
 *
 * The `partialFilterExpression` restricts the uniqueness constraint
 * to documents where status = ACTIVE only, so CANCELLED / EXPIRED
 * reservations do NOT count against this constraint.
 */
reservationSchema.index(
  { userId: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ReservationStatus.ACTIVE },
    name: 'idx_reservation_userId_eventId_active_unique',
  },
);

/**
 * Compound index for common query patterns:
 * "Get all reservations for user X on event Y with status Z"
 */
reservationSchema.index(
  { userId: 1, eventId: 1, status: 1 },
  { name: 'idx_reservation_userId_eventId_status' },
);

/**
 * Compound index for user booking history queries:
 * Filters by userId and status, then sorts by bookedAt descending.
 */
reservationSchema.index(
  { userId: 1, status: 1, bookedAt: -1 },
  { name: 'idx_reservation_userId_status_bookedAt' },
);

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────
export const Reservation = model<ReservationDocument, ReservationModel>(
  'Reservation',
  reservationSchema,
);

export { ReservationStatus };
export type { IReservation };
