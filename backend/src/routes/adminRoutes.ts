import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../types/user.types';
import * as adminController from '../controllers/adminController';
import { createEventSchema, updateEventSchema, eventIdParamSchema } from '../validators/event.validator';

const router = Router();

// Apply auth middlewares to all admin routes
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/events', adminController.getAllEvents);

router.post(
  '/events',
  validate({ body: createEventSchema }),
  adminController.createEvent
);

router.put(
  '/events/:id',
  validate({ params: eventIdParamSchema, body: updateEventSchema }),
  adminController.updateEvent
);

router.delete(
  '/events/:id',
  validate({ params: eventIdParamSchema }),
  adminController.deleteEvent
);

export const adminRouter = router;
