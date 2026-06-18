// ─────────────────────────────────────────────────────────────
//  User Types & Enums
// ─────────────────────────────────────────────────────────────
import type { Types } from 'mongoose';

// ── Enum ─────────────────────────────────────────────────────
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ── Core Interface ────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ── ObjectId ref shapes used by other models ─────────────────
export interface IUserRef {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
}
