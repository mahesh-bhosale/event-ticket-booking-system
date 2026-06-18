import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env';
import { logger } from './utils/logger';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/index';

// ─────────────────────────────────────────────────────────────
//  Application Factory
// ─────────────────────────────────────────────────────────────
const app: Application = express();

// ── 1. Security Headers ───────────────────────────────────────
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ── 3. Body Parsers ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 4. NoSQL Injection Prevention ────────────────────────────
app.use(mongoSanitize());

// ── 5. Global Rate Limiter ────────────────────────────────────
app.use(globalRateLimiter);

// ── 6. Request Logger ─────────────────────────────────────────
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

// ── 7. Trust Proxy (for rate limiter behind reverse proxy) ────
app.set('trust proxy', 1);

// ── 8. API Routes ─────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 9. 404 Handler ────────────────────────────────────────────
app.use(notFound);

// ── 10. Centralized Error Handler ─────────────────────────────
app.use(errorHandler);

export default app;
