import { Schema, model, type Document, type Model } from 'mongoose';
import { UserRole, type IUser } from '../types/user.types';

// ─────────────────────────────────────────────────────────────
//  Document & Model Types
// ─────────────────────────────────────────────────────────────

/** Mongoose Document augmented with IUser fields */
export type UserDocument = IUser & Document;

/** Mongoose Model type for User */
export type UserModel = Model<UserDocument>;

// ─────────────────────────────────────────────────────────────
//  Schema Definition
// ─────────────────────────────────────────────────────────────
const userSchema = new Schema<UserDocument, UserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must not exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never returned in queries unless explicitly requested
    },

    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
      },
      default: UserRole.USER,
    },
  },
  {
    timestamps: true,
    // Lean-friendly: strip __v from query results
    versionKey: false,
  },
);

// ─────────────────────────────────────────────────────────────
//  Indexes
// ─────────────────────────────────────────────────────────────
// Unique index on email (also enforced by unique: true in schema,
// but explicit index gives us fine-grained control)
userSchema.index({ email: 1 }, { unique: true, name: 'idx_user_email_unique' });

// ─────────────────────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────────────────────
export const User = model<UserDocument, UserModel>('User', userSchema);

// Re-export types and enum for convenience
export { UserRole };
export type { IUser };
