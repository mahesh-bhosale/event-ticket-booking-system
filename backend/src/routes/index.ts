import { Router } from 'express';

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

// ── Domain Routes (add as features are implemented) ──────────
// import { authRouter } from './auth.routes';
// import { eventRouter } from './event.routes';
// import { bookingRouter } from './booking.routes';
// import { userRouter } from './user.routes';

// router.use('/auth', authRouter);
// router.use('/events', eventRouter);
// router.use('/bookings', bookingRouter);
// router.use('/users', userRouter);

export default router;
