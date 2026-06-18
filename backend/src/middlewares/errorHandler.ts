import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
//  Error Handler Middleware
// ─────────────────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // ── Log every error ──────────────────────────────────────
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, {
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body as unknown,
    params: req.params,
    query: req.query,
  });

  // ── Operational ApiError (safe to expose) ────────────────
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  // ── Mongoose Duplicate Key ────────────────────────────────
  const mongoErr = err as MongoError;
  if (mongoErr.code === 11000 && mongoErr.keyValue) {
    const field = Object.keys(mongoErr.keyValue)[0] ?? 'field';
    res.status(409).json({
      success: false,
      statusCode: 409,
      message: `Duplicate value for ${field}`,
      errors: [`${field} already exists`],
    });
    return;
  }

  // ── Mongoose Validation Error ─────────────────────────────
  if (err.name === 'ValidationError') {
    res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors: [err.message],
    });
    return;
  }

  // ── Mongoose CastError (bad ObjectId) ────────────────────
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid ID format',
      errors: [err.message],
    });
    return;
  }

  // ── JWT Errors ────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token',
      errors: [err.message],
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token expired',
      errors: [],
    });
    return;
  }

  // ── Unknown / Unexpected Errors ───────────────────────────
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    errors: [],
    ...(env.NODE_ENV === 'development'
      ? { detail: err.message, stack: err.stack }
      : {}),
  });
}
