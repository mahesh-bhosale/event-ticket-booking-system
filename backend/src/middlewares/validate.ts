import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type Joi from 'joi';
import { ApiError } from '../utils/ApiError';

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

interface ValidateTargets {
  body?: Joi.Schema;
  params?: Joi.Schema;
  query?: Joi.Schema;
}

// ─────────────────────────────────────────────────────────────
//  validate — Reusable Joi Validation Middleware Factory
// ─────────────────────────────────────────────────────────────

/**
 * Validate request body, params, and/or query against Joi schemas.
 *
 * @example
 * // Validate body only
 * router.post('/register', validate({ body: registerSchema }), handler);
 *
 * @example
 * // Validate body + params
 * router.put('/:id', validate({ params: idSchema, body: updateSchema }), handler);
 */
export function validate(schemas: ValidateTargets): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // ── Validate body ─────────────────────────────────────────
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        error.details.forEach((d) => errors.push(d.message));
      } else {
        // Replace body with Joi-coerced/stripped value
        req.body = value as Record<string, unknown>;
      }
    }

    // ── Validate params ───────────────────────────────────────
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        error.details.forEach((d) => errors.push(d.message));
      } else {
        req.params = value as Record<string, string>;
      }
    }

    // ── Validate query ────────────────────────────────────────
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        error.details.forEach((d) => errors.push(d.message));
      } else {
        req.query = value as Record<string, string>;
      }
    }

    // ── Forward errors ────────────────────────────────────────
    if (errors.length > 0) {
      next(ApiError.badRequest('Validation failed', errors));
      return;
    }

    next();
  };
}
