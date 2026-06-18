import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { reserveSeatsSchema } from '../validators/reservation.validator';
import { reserveSeats } from '../controllers/reservationController';

const reservationRouter = Router();

/**
 * POST /api/reserve (or /api/v1/reserve)
 * Authentication: Required
 * Validation: eventId, seatNumbers
 */
reservationRouter.post(
  '/',
  authenticate,
  validate({ body: reserveSeatsSchema }),
  reserveSeats,
);

export default reservationRouter;
export { reservationRouter };
