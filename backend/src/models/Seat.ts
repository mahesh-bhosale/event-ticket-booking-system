import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { SeatStatus, SEAT_NUMBER_PATTERN, type ISeat } from '../types/seat.types';

// ─────────────────────────────────────────────────────────────
//  Document & Model Types
// ─────────────────────────────────────────────────────────────

/** Mongoose Document augmented with ISeat fields */
export type SeatDocument = ISeat & Document;

/** Mongoose Model type for Seat */
export type SeatModel = Model<SeatDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema Definition
// ─────────────────────────────────────────────────────────────
const seatSchema = new Schema<SeatDocument, SeatModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'eventId is required'],
      index: true,
    },

    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      validate: {
        validator(value: string): boolean {
          return SEAT_NUMBER_PATTERN.test(value);
        },
        message:
          'Seat number must match pattern [A-H][1-10] (e.g. A1, B5, H10)',
      },
    },

    status: {
      type: String,
      enum: {
        values: Object.values(SeatStatus),
        message: `Status must be one of: ${Object.values(SeatStatus).join(', ')}`,
      },
      default: SeatStatus.AVAILABLE,
    },

    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reservedAt: {
      type: Date,
      default: null,
    },

    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────

/**
 * Compound unique index: each seat number is unique within an event.
 * This is the primary constraint preventing duplicate seat creation.
 */
seatSchema.index(
  { eventId: 1, seatNumber: 1 },
  { unique: true, name: 'idx_seat_eventId_seatNumber_unique' },
);

/**
 * Compound index for seat availability queries (most frequent pattern):
 * "Get all AVAILABLE seats for event X"
 */
seatSchema.index(
  { eventId: 1, status: 1 },
  { name: 'idx_seat_eventId_status' },
);

// ─────────────────────────────────────────────────────────────
//  Virtuals
// ─────────────────────────────────────────────────────────────

/** Derived row letter from seat number (A1 → "A") */
seatSchema.virtual('row').get(function (this: SeatDocument): string {
  return this.seatNumber.charAt(0);
});

/** Derived column number from seat number (A1 → 1) */
seatSchema.virtual('column').get(function (this: SeatDocument): number {
  return parseInt(this.seatNumber.slice(1), 10);
});

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────
export const Seat = model<SeatDocument, SeatModel>('Seat', seatSchema);

export { SeatStatus };
export type { ISeat };

// Convenience re-export so callers don't need the types file directly
export type { Types as SeatObjectIdTypes };
