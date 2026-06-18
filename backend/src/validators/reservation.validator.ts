import Joi from 'joi';

// ─────────────────────────────────────────────────────────────
//  Schemas
// ─────────────────────────────────────────────────────────────

export const reserveSeatsSchema = Joi.object({
  eventId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'eventId must be a valid ObjectId',
      'any.required': 'eventId is required',
      'string.empty': 'eventId cannot be empty',
    }),

  seatNumbers: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[A-H]([1-9]|10)$/)
        .messages({
          'string.pattern.base': 'Seat number must match pattern [A-H][1-10] (e.g. A1, B5, H10)',
        }),
    )
    .min(1)
    .max(8)
    .unique()
    .required()
    .messages({
      'array.min': 'seatNumbers must contain at least one seat',
      'array.max': 'seatNumbers cannot exceed 8 seats',
      'array.unique': 'seatNumbers must contain unique values only',
      'any.required': 'seatNumbers is required',
    }),
});
