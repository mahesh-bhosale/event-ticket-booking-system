import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { getBookingHistoryQuerySchema } from '../validators/bookingHistory.validator';
import { getBookingHistory } from '../controllers/bookingHistory.controller';

const bookingHistoryRouter = Router();

/**
 * GET /api/bookings/history
 * Authentication: Required
 * Query parameters: page, limit, search, timeRange
 */
bookingHistoryRouter.get(
  '/',
  authenticate,
  validate({ query: getBookingHistoryQuerySchema }),
  getBookingHistory,
);

export default bookingHistoryRouter;
export { bookingHistoryRouter };
