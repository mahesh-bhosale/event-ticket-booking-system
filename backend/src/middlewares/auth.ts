import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { AccessTokenPayload, AuthenticatedUser } from '../types/auth.types';

// ─────────────────────────────────────────────────────────────
//  Extend Express Request with typed auth context
// ─────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by `authenticate` middleware — never contains passwordHash */
      user?: AuthenticatedUser;
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  authenticate — JWT Bearer Verification
// ─────────────────────────────────────────────────────────────

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * On success attaches `{ userId, email, role }` to `req.user`.
 *
 * Forwards:
 *   - 401 if header is missing / malformed
 *   - 401 if token is expired
 *   - 401 if token is invalid
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
      return;
    }
    next(ApiError.unauthorized('Invalid token'));
  }
}

// ─────────────────────────────────────────────────────────────
//  authorize — Role-Based Access Control Guard
// ─────────────────────────────────────────────────────────────

/**
 * Must be used **after** `authenticate`.
 * Rejects the request if `req.user.role` is not in the allowed list.
 *
 * @example
 * router.delete('/events/:id', authenticate, authorize('ADMIN'), handler);
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
}
