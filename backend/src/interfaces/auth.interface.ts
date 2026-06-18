import type { Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────
//  IRefreshToken — Mongoose schema interface
// ─────────────────────────────────────────────────────────────

export interface IRefreshToken {
  /** Owner of this session */
  userId: Types.ObjectId;

  /**
   * SHA-256 hash of the raw refresh token string.
   * We NEVER store the raw token — only its hash.
   */
  tokenHash: string;

  /** When this refresh token expires (used for TTL index) */
  expiresAt: Date;

  /** When this token record was created */
  createdAt: Date;

  /** Each time the token is used to rotate, this is updated */
  lastUsedAt: Date | null;

  /**
   * True when the token has been rotated (superseded) or manually
   * revoked via logout.  Reuse of a revoked token triggers the
   * security escalation path (revoke all sessions for the user).
   */
  isRevoked: boolean;

  /** Client User-Agent header stored for audit/forensics */
  userAgent: string | null;

  /** Client IP address stored for audit/forensics */
  ipAddress: string | null;
}
