// src/config/index.js
// Centralized configuration loader — validates env vars at boot time.
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[config] Missing env vars: ${missing.join(', ')}. Using insecure dev defaults.`
    );
  } else {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: process.env.DB_PATH || './data/auth.db',
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || 'dev_access_secret_insecure_change_me',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_insecure_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
