import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

// ─────────────────────────────────────────────────────────────
//  Connect with Retry Logic
// ─────────────────────────────────────────────────────────────
export async function connectDB(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Keeps connection pool alive
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
    });

    logger.info(`✅  MongoDB connected: ${mongoose.connection.host}`);

    // ── Connection event listeners ──
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️   MongoDB disconnected — attempting reconnect…');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄  MongoDB reconnected');
    });

    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error', { error: err.message });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, {
      error: message,
    });

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await delay(RETRY_DELAY_MS);
      return connectDB(attempt + 1);
    }

    logger.error('Max connection retries reached. Shutting down.');
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
//  Graceful Disconnect
// ─────────────────────────────────────────────────────────────
export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

// ─────────────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
