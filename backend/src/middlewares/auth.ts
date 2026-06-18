import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  Auth Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to `req.user`.
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
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Access token expired'));
      return;
    }
    next(ApiError.unauthorized('Invalid access token'));
  }
}

/**
 * Role-based access control guard.
 * Must be used AFTER `authenticate`.
 *
 * @example
 * router.delete('/events/:id', authenticate, authorize('admin'), handler);
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
