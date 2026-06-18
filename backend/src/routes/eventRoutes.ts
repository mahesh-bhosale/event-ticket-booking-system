import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { getEventsQuerySchema } from '../validators/event.validator';
import { getAllEvents, getEventById } from '../controllers/eventController';

const eventRouter = Router();

/**
 * GET /api/events or /api/v1/events
 * Query params: page, limit, date
 */
eventRouter.get(
  '/',
  validate({ query: getEventsQuerySchema }),
  getAllEvents,
);

/**
 * GET /api/events/:id or /api/v1/events/:id
 * Path params: id (Validated inside the handler to return custom exact error messages)
 */
eventRouter.get(
  '/:id',
  getEventById,
);

export default eventRouter;
export { eventRouter };
