import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { confirmBookingSchema } from '../validators/booking.validator';
import { confirmBooking } from '../controllers/bookingController';

const bookingRouter = Router();

/**
 * POST /api/bookings (or /api/v1/bookings)
 * Authentication: Required
 * Validation: reservationId
 */
bookingRouter.post(
  '/',
  authenticate,
  validate({ body: confirmBookingSchema }),
  confirmBooking,
);

export default bookingRouter;
export { bookingRouter };
