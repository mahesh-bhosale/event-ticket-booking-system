import Joi from 'joi';

// ─────────────────────────────────────────────────────────────
//  Reusable Field Rules
// ─────────────────────────────────────────────────────────────

const email = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.empty': 'Email cannot be empty',
  });

const password = Joi.string()
  .min(8)
  .pattern(/^(?=.*[A-Z])(?=.*\d).*$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter and one number',
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  });

// ─────────────────────────────────────────────────────────────
//  Schemas
// ─────────────────────────────────────────────────────────────

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty',
    }),
  email,
  password,
});

export const loginSchema = Joi.object({
  email,
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'refreshToken is required',
    'string.empty': 'refreshToken cannot be empty',
  }),
});
