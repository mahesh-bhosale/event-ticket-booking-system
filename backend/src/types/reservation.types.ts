// ─────────────────────────────────────────────────────────────
//  Reservation Types & Enums
// ─────────────────────────────────────────────────────────────
import type { Types } from 'mongoose';

// ── Enum ─────────────────────────────────────────────────────
export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// ── Core Interface ────────────────────────────────────────────
export interface IReservation {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatNumbers: string[];
  seatIds: Types.ObjectId[];
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── DTO shapes ────────────────────────────────────────────────
export interface CreateReservationDTO {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatNumbers: string[];
  seatIds: Types.ObjectId[];
  expiresAt: Date;
}
