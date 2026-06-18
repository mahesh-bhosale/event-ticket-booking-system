import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isProduction = env.NODE_ENV === 'production';

  // Log all errors internally
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, {
    stack: !isProduction ? err.stack : undefined,
    body: req.body as unknown,
    params: req.params,
    query: req.query,
  });

  // 1. Operational ApiError (developer-safe messages)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(!isProduction ? { stack: err.stack } : {}),
    });
    return;
  }

  // 2. Mongoose Duplicate Key Error (11000)
  const mongoErr = err as MongoError;
  if (mongoErr.code === 11000) {
    const offendingField = mongoErr.keyValue ? Object.keys(mongoErr.keyValue)[0] : 'unknown';
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: [offendingField], // Always include offending field
    });
    return;
  }

  // 3. Mongoose Validation Error (ValidationError)
  if (err.name === 'ValidationError') {
    const mongooseErr = err as any;
    // Extract validation error messages
    const validationErrors = Object.values(mongooseErr.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors.length > 0 ? validationErrors : [err.message],
    });
    return;
  }

  // 4. Mongoose CastError (Bad ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid resource identifier',
    });
    return;
  }

  // 5. JWT Expiration Error (TokenExpiredError)
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.',
    });
    return;
  }

  // 6. JWT Invalid Error (JsonWebTokenError)
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
    return;
  }

  // 7. Unknown/Fallback Internal Errors
  res.status(500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : err.message,
    ...(!isProduction ? { stack: err.stack } : {}),
  });
}
