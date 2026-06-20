import Joi from 'joi';

// ─────────────────────────────────────────────────────────────
//  Schemas
// ─────────────────────────────────────────────────────────────

export const getEventsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
    }),

  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
    }),

  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters',
    }),

  city: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'City filter must not exceed 100 characters',
    }),

  sort: Joi.string()
    .valid('date_asc', 'date_desc', 'name_asc', 'name_desc')
    .default('date_asc')
    .optional()
    .messages({
      'any.only': 'Sort must be one of: date_asc, date_desc, name_asc, name_desc',
    }),
});

export const eventIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid event id',
      'any.required': 'Event ID is required',
    }),
});

export const createEventSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(1000).required(),
  venue: Joi.string().trim().max(200).required(),
  dateTime: Joi.date().iso().greater('now').required(),
  totalSeats: Joi.number().valid(80).required().messages({
    'any.only': 'Total seats must be exactly 80 for this application',
  }),
  image: Joi.string().uri().max(2048).required(),
  category: Joi.string().trim().max(100).optional(),
  price: Joi.number().min(0).optional(),
  location: Joi.string().trim().max(200).optional(),
  isActive: Joi.boolean().default(true),
});

export const updateEventSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  description: Joi.string().trim().max(1000).optional(),
  venue: Joi.string().trim().max(200).optional(),
  dateTime: Joi.date().iso().greater('now').optional(),
  image: Joi.string().uri().max(2048).optional(),
  category: Joi.string().trim().max(100).optional(),
  price: Joi.number().min(0).optional(),
  location: Joi.string().trim().max(200).optional(),
  isActive: Joi.boolean().optional(),
});
