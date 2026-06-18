// ─────────────────────────────────────────────────────────────
//  Seat Types & Enums
// ─────────────────────────────────────────────────────────────
import type { Types } from 'mongoose';

// ── Enum ─────────────────────────────────────────────────────
export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  BOOKED = 'BOOKED',
}

// ── Seat number regex — rows A-H, numbers 1-10 ───────────────
export const SEAT_NUMBER_PATTERN = /^[A-H]([1-9]|10)$/;
export const SEAT_NUMBER_PATTERN_SOURCE = '^[A-H]([1-9]|10)$';

// ── Core Interface ────────────────────────────────────────────
export interface ISeat {
  eventId: Types.ObjectId;
  seatNumber: string;
  status: SeatStatus;
  reservedBy: Types.ObjectId | null;
  reservedAt: Date | null;
  reservationId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Bulk create DTO ──────────────────────────────────────────
export interface CreateSeatsDTO {
  eventId: Types.ObjectId;
  seatNumbers: string[];
}
