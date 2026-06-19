import { Router } from 'express';
import authRouter from './authRoutes';

// ─────────────────────────────────────────────────────────────
//  Route Aggregator
//  Import and mount all domain-specific routers here.
// ─────────────────────────────────────────────────────────────
const router = Router();

// ── Health Check ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'SortMyScene API is healthy 🟢',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'] ?? 'unknown',
    },
  });
});

// ── Domain Routes ─────────────────────────────────────────────
router.use('/auth', authRouter);

import { eventRouter } from './eventRoutes';
router.use('/events', eventRouter);

import { reservationRouter } from './reservationRoutes';
router.use('/reserve', reservationRouter);

import { bookingRouter } from './bookingRoutes';
router.use('/bookings', bookingRouter);

import { adminRouter } from './adminRoutes';
router.use('/admin', adminRouter);

// Future routes (uncomment as features are implemented):
// import { userRouter } from './userRoutes';
// router.use('/users', userRouter);

export default router;
