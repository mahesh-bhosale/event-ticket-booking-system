import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env before any validation
dotenv.config();

// ─────────────────────────────────────────────────────────────
//  Schema
// ─────────────────────────────────────────────────────────────
const envSchema = z.object({
  // Node
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Server
  PORT: z.coerce.number().int().positive().default(5000),

  // MongoDB
  MONGODB_URI: z
    .string()
    .url({ message: 'MONGODB_URI must be a valid connection string URL' }),

  // JWT — access token
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // JWT — refresh token
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CLIENT_URL: z.string().url({ message: 'CLIENT_URL must be a valid URL' }),
});

// ─────────────────────────────────────────────────────────────
//  Parse & Validate
// ─────────────────────────────────────────────────────────────
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  const formatted = _parsed.error.format();
  console.error('❌  Invalid environment variables:\n', JSON.stringify(formatted, null, 2));
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
//  Exported, Typed Config
// ─────────────────────────────────────────────────────────────
export const env = _parsed.data;

export type Env = typeof env;
