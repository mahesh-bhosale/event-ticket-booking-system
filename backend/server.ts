// ─────────────────────────────────────────────────────────────
//  server.ts — Entry Point
//  Only responsibility: start the HTTP server and handle
//  graceful shutdown. No business logic here.
// ─────────────────────────────────────────────────────────────

// Must be first import — validates env vars before anything else
import './src/config/env';

import http from 'http';
import app from './src/app';
import { connectDB, disconnectDB } from './src/config/db';
import { logger } from './src/utils/logger';
import { env } from './src/config/env';

const PORT = env.PORT;

// ─────────────────────────────────────────────────────────────
//  Bootstrap
// ─────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB (exits on failure)
  await connectDB();

  // 2. Start HTTP server
  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`🚀  Server running on http://localhost:${PORT}`);
    logger.info(`📦  Environment: ${env.NODE_ENV}`);
    logger.info(`🔗  API base URL: http://localhost:${PORT}/api/v1`);
  });

  // ── Graceful Shutdown ────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`\n📴  Received ${signal}. Shutting down gracefully…`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info('✅  Shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10s if graceful fails
    setTimeout(() => {
      logger.error('⏱️  Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ── Unhandled Rejections & Exceptions ───────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`Failed to bootstrap server: ${message}`);
  process.exit(1);
});
