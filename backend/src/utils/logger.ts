import winston from 'winston';
import path from 'path';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ─────────────────────────────────────────────────────────────
//  Custom Format — Development Console
// ─────────────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return stack
      ? `${ts} [${level}]: ${message}\n${stack}${metaStr}`
      : `${ts} [${level}]: ${message}${metaStr}`;
  }),
);

// ─────────────────────────────────────────────────────────────
//  Transports
// ─────────────────────────────────────────────────────────────
const transports: winston.transport[] = [];

if (env.NODE_ENV === 'development') {
  transports.push(new winston.transports.Console({ format: devFormat }));
} else {
  // Production: minimal console + file rotation
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), errors({ stack: true }), json()),
      level: 'warn',
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  );
}

// ─────────────────────────────────────────────────────────────
//  Logger Instance
// ─────────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transports,
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});
