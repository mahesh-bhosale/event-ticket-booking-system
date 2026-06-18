import Joi from 'joi';

// ─────────────────────────────────────────────────────────────
//  Schemas
// ─────────────────────────────────────────────────────────────

export const confirmBookingSchema = Joi.object({
  reservationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid reservation id',
      'any.required': 'reservationId is required',
      'string.empty': 'reservationId cannot be empty',
    }),
});
