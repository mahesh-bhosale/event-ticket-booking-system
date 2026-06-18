// ─────────────────────────────────────────────────────────────
//  Reservation Types & Enums
// ─────────────────────────────────────────────────────────────
import type { Types } from 'mongoose';
import type { Request } from 'express';
import type { AuthenticatedUser } from './auth.types';

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

// ── Request & Response Interfaces ─────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ReserveSeatsInput {
  eventId: string;
  seatNumbers: string[];
}

export interface ReserveSeatsResult {
  reservationId: string;
  seatNumbers: string[];
  expiresAt: Date;
  expiresInSeconds: number;
}

