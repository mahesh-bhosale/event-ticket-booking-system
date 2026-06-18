import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';

import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';

import type {
  RegisterInput,
  LoginInput,
  AuthResult,
  TokenPair,
  PublicUser,
  AccessTokenPayload,
} from '../types/auth.types';
import type { UserDocument } from '../models/User';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────
//  Private Helpers
// ─────────────────────────────────────────────────────────────

/** Convert a raw UserDocument to a safe PublicUser (no passwordHash) */
function toPublicUser(user: UserDocument): PublicUser {
  return {
    _id: user._id as Types.ObjectId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Generate a cryptographically random opaque refresh token string */
function generateRawRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/** Hash a raw refresh token with SHA-256 for storage */
function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Parse a duration string like "7d" or "15m" into milliseconds */
function parseDurationMs(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * 1_000;
    case 'm':
      return value * 60 * 1_000;
    case 'h':
      return value * 60 * 60 * 1_000;
    case 'd':
      return value * 24 * 60 * 60 * 1_000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/** Sign a JWT access token */
function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Persist a new refresh token record.
 * The raw token is NEVER stored — only its SHA-256 hash.
 */
async function persistRefreshToken(
  userId: Types.ObjectId,
  rawToken: string,
  meta: { userAgent: string | null; ipAddress: string | null },
): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
}

/** Revoke ALL active refresh tokens for a user (security escalation) */
async function revokeAllUserTokens(userId: string, reason: string): Promise<void> {
  const result = await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true },
  );

  logger.warn(`[AUTH] Security escalation — revoked all tokens for user ${userId}`, {
    reason,
    revokedCount: result.modifiedCount,
  });
}

// ─────────────────────────────────────────────────────────────
//  Auth Service
// ─────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * - Checks for duplicate email (409)
 * - Hashes password with bcrypt (12 rounds)
 * - Creates user document
 * - Issues access + refresh tokens
 */
export async function register(
  input: RegisterInput,
  meta: { userAgent: string | null; ipAddress: string | null },
): Promise<AuthResult> {
  const { name, email, password } = input;

  // 1. Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 3. Create user
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

  // 4. Generate tokens
  const accessToken = signAccessToken({
    userId: (user._id as Types.ObjectId).toString(),
    email: user.email,
    role: user.role,
  });

  const rawRefreshToken = generateRawRefreshToken();
  await persistRefreshToken(user._id as Types.ObjectId, rawRefreshToken, meta);

  logger.info(`[AUTH] User registered: ${user.email}`);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Login an existing user.
 * - Always returns "Invalid credentials" — never leaks whether email/password is wrong
 * - Verifies bcrypt hash
 * - Issues access + refresh tokens
 */
export async function login(
  input: LoginInput,
  meta: { userAgent: string | null; ipAddress: string | null },
): Promise<AuthResult> {
  const { email, password } = input;

  // 1. Find user (select passwordHash explicitly — it is select:false)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    // Constant-time guard: run bcrypt even when user doesn't exist
    await bcrypt.compare(password, '$2b$12$invalidHashForTimingAttackPrevention000000000000000');
    throw ApiError.unauthorized('Invalid credentials');
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // 3. Generate tokens
  const accessToken = signAccessToken({
    userId: (user._id as Types.ObjectId).toString(),
    email: user.email,
    role: user.role,
  });

  const rawRefreshToken = generateRawRefreshToken();
  await persistRefreshToken(user._id as Types.ObjectId, rawRefreshToken, meta);

  logger.info(`[AUTH] User logged in: ${user.email}`);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Get the currently authenticated user's public profile.
 */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return {
    _id: user._id as Types.ObjectId,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Rotate a refresh token.
 *
 * Security properties:
 * 1. Verifies the token hash exists in the database
 * 2. Reuse detection: if the token is already revoked, ALL user sessions are killed
 * 3. Revokes the old token
 * 4. Issues a new token pair
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta: { userAgent: string | null; ipAddress: string | null },
): Promise<TokenPair> {
  const tokenHash = hashRefreshToken(rawToken);

  // 1. Lookup the token record
  const tokenRecord = await RefreshToken.findOne({ tokenHash });

  if (!tokenRecord) {
    throw ApiError.unauthorized('Invalid token');
  }

  // 2. Reuse detection — token exists but is revoked
  if (tokenRecord.isRevoked) {
    await revokeAllUserTokens(
      tokenRecord.userId.toString(),
      'Revoked refresh token reuse detected',
    );

    throw new ApiError(
      401,
      'Session compromised. Please login again.',
    );
  }

  // 3. Check expiry (belt-and-suspenders alongside TTL index)
  if (tokenRecord.expiresAt <= new Date()) {
    throw ApiError.unauthorized('Token expired');
  }

  // 4. Revoke the current token (mark as rotated)
  tokenRecord.isRevoked = true;
  tokenRecord.lastUsedAt = new Date();
  await tokenRecord.save();

  // 5. Look up the user to sign a fresh access token
  const user = await User.findById(tokenRecord.userId).lean();
  if (!user) {
    throw ApiError.unauthorized('Invalid token');
  }

  // 6. Issue new token pair
  const newAccessToken = signAccessToken({
    userId: (user._id as Types.ObjectId).toString(),
    email: user.email,
    role: user.role,
  });

  const newRawRefreshToken = generateRawRefreshToken();
  await persistRefreshToken(tokenRecord.userId, newRawRefreshToken, meta);

  logger.info(`[AUTH] Refresh token rotated for user: ${user.email}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
  };
}

/**
 * Logout — revokes the provided refresh token for the current session.
 * Other device sessions remain active (multi-device support).
 */
export async function logout(rawToken: string, userId: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);

  const result = await RefreshToken.findOneAndUpdate(
    { tokenHash, userId, isRevoked: false },
    { isRevoked: true, lastUsedAt: new Date() },
  );

  if (!result) {
    // Token not found or already revoked — still succeed (idempotent)
    logger.warn(`[AUTH] Logout attempted with unknown/revoked token for user ${userId}`);
  } else {
    logger.info(`[AUTH] User logged out: ${userId}`);
  }
}
