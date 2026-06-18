import type { Types } from 'mongoose';
import type { UserRole } from '../types/user.types';

// ─────────────────────────────────────────────────────────────
//  Auth Service Inputs / Outputs
// ─────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
  userId: string;
}

// ─────────────────────────────────────────────────────────────
//  Public User Shape (never includes passwordHash)
// ─────────────────────────────────────────────────────────────

export interface PublicUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
//  Token Pair Returned by Auth Service
// ─────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────────────────────
//  Auth Service Return Values
// ─────────────────────────────────────────────────────────────

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────────────────────
//  JWT Payload (what is encoded in the access token)
// ─────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  /** standard claims */
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────────────────────
//  Request-Level Auth Context (attached to req.user)
// ─────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}
