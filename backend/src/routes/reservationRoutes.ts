import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  reservationIdParamSchema,
  reserveSeatsSchema,
} from '../validators/reservation.validator';
import { cancelReservation, reserveSeats } from '../controllers/reservationController';

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

/**
 * DELETE /api/reserve/:reservationId (or /api/v1/reserve/:reservationId)
 * Authentication: Required
 */
reservationRouter.delete(
  '/:reservationId',
  authenticate,
  validate({ params: reservationIdParamSchema }),
  cancelReservation,
);

export default reservationRouter;
export { reservationRouter };
