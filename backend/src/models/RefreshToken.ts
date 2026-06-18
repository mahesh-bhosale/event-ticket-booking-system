import { Schema, model, type Document, type Model } from 'mongoose';
import type { IRefreshToken } from '../interfaces/auth.interface';

// ─────────────────────────────────────────────────────────────
//  Document & Model Types
// ─────────────────────────────────────────────────────────────

export type RefreshTokenDocument = IRefreshToken & Document;
export type RefreshTokenModel = Model<RefreshTokenDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema
// ─────────────────────────────────────────────────────────────
const refreshTokenSchema = new Schema<RefreshTokenDocument, RefreshTokenModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    /**
     * SHA-256 hash of the raw token (hex-encoded).
     * Stored hashed so that a database leak does NOT expose
     * usable refresh tokens.
     */
    tokenHash: {
      type: String,
      required: [true, 'tokenHash is required'],
      unique: true,
      index: true,
    },

    /**
     * TTL index — MongoDB removes expired documents automatically.
     * expireAfterSeconds: 0 means "expire at the value of this field".
     */
    expiresAt: {
      type: Date,
      required: [true, 'expiresAt is required'],
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    userAgent: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    /**
     * We manage `createdAt` explicitly via timestamps so that we
     * also get `updatedAt` for auditing (e.g. when isRevoked flips).
     */
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────

/** TTL: MongoDB removes the document after expiresAt has passed */
refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'idx_refreshToken_expiresAt_ttl',
  },
);

/** Compound index: fetch all active sessions for a user fast */
refreshTokenSchema.index(
  { userId: 1, isRevoked: 1 },
  { name: 'idx_refreshToken_userId_isRevoked' },
);

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────
export const RefreshToken = model<RefreshTokenDocument, RefreshTokenModel>(
  'RefreshToken',
  refreshTokenSchema,
);

export type { IRefreshToken };
