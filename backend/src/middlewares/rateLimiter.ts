import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
//  Global API Rate Limiter
//  100 requests per 15 minutes per IP
// ─────────────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-7', // RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
    errors: [],
  },
  skip: () => env.NODE_ENV === 'test',
});

// ─────────────────────────────────────────────────────────────
//  Auth Route Rate Limiter (stricter)
//  10 requests per 15 minutes per IP
// ─────────────────────────────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    errors: [],
  },
  skip: () => env.NODE_ENV === 'test',
});
