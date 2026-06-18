import { Router } from 'express';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';
import {
  register,
  login,
  getMe,
  refresh,
  logout,
} from '../controllers/authController';

// ─────────────────────────────────────────────────────────────
//  Auth Router
//  Mounted at: /api/v1/auth
// ─────────────────────────────────────────────────────────────
const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Rate limited (5/15min) → validate body → register handler
 */
authRouter.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  register,
);

/**
 * POST /api/v1/auth/login
 * Rate limited (5/15min) → validate body → login handler
 */
authRouter.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  login,
);

/**
 * GET /api/v1/auth/me
 * Protected (JWT required) → return current user
 */
authRouter.get(
  '/me',
  authenticate,
  getMe,
);

/**
 * POST /api/v1/auth/refresh
 * Rate limited (5/15min) → validate body → rotate tokens
 */
authRouter.post(
  '/refresh',
  authRateLimiter,
  validate({ body: refreshTokenSchema }),
  refresh,
);

/**
 * POST /api/v1/auth/logout
 * Protected (JWT required) → revoke refresh token
 */
authRouter.post(
  '/logout',
  authenticate,
  logout,
);

export default authRouter;
