import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

// ─────────────────────────────────────────────────────────────
//  404 Not Found — Must be registered AFTER all routes
// ─────────────────────────────────────────────────────────────
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(
    ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`),
  );
}
