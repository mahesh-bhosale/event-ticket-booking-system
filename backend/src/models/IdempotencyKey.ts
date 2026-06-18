import { Schema, model, type Document, type Model, type Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────
//  Interface & Document Types
// ─────────────────────────────────────────────────────────────

export interface IIdempotencyKey {
  key: string;
  userId: Types.ObjectId;
  endpoint: string;
  requestHash: string;
  responseBody: Record<string, unknown>;
  statusCode: number;
  createdAt: Date;
  expiresAt: Date;
}

export type IdempotencyKeyDocument = IIdempotencyKey & Document;
export type IdempotencyKeyModel = Model<IdempotencyKeyDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema Definition
// ─────────────────────────────────────────────────────────────

const idempotencyKeySchema = new Schema<IdempotencyKeyDocument, IdempotencyKeyModel>(
  {
    key: {
      type: String,
      required: [true, 'key is required'],
      unique: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },

    endpoint: {
      type: String,
      required: [true, 'endpoint is required'],
      trim: true,
    },

    requestHash: {
      type: String,
      required: [true, 'requestHash is required'],
      trim: true,
    },

    responseBody: {
      type: Schema.Types.Mixed,
      required: [true, 'responseBody is required'],
    },

    statusCode: {
      type: Number,
      required: [true, 'statusCode is required'],
    },

    expiresAt: {
      type: Date,
      required: [true, 'expiresAt is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────

/**
 * Key unique index (this acts as the primary distributed lock/uniqueness check)
 */
idempotencyKeySchema.index({ key: 1 }, { unique: true, name: 'idx_idempotency_key_unique' });

/**
 * TTL Index — automatically clean up expired idempotency keys (expireAfterSeconds: 0)
 */
idempotencyKeySchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'idx_idempotency_expiresAt_ttl',
  },
);

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────

export const IdempotencyKey = model<IdempotencyKeyDocument, IdempotencyKeyModel>(
  'IdempotencyKey',
  idempotencyKeySchema,
);
