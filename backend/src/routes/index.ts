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

// Future routes (uncomment as features are implemented):
// import { eventRouter } from './eventRoutes';
// import { bookingRouter } from './bookingRoutes';
// import { userRouter } from './userRoutes';
// router.use('/events', eventRouter);
// router.use('/bookings', bookingRouter);
// router.use('/users', userRouter);

export default router;
