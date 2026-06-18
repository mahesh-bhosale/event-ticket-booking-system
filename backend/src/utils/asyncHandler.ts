import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ─────────────────────────────────────────────────────────────
//  asyncHandler — Wraps async route handlers to forward errors
//  to the centralized Express error middleware.
// ─────────────────────────────────────────────────────────────

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | Promise<Response>;

/**
 * Wraps an async Express route handler so that any rejected
 * promise is automatically forwarded to `next(error)`.
 *
 * @example
 * router.get('/resource', asyncHandler(async (req, res) => {
 *   const data = await service.getAll();
 *   res.json(ApiResponse.ok('Fetched', data));
 * }));
 */
export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
