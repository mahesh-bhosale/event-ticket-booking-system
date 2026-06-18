import type { Request, Response } from 'express';

// ─────────────────────────────────────────────────────────────
//  404 Not Found — Registered AFTER all route maps
// ─────────────────────────────────────────────────────────────
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
