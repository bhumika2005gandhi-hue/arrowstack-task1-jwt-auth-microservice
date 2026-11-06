// src/server.js
// App bootstrap — wires middleware, routes, error handlers.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Core middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ── Rate limiter (applies to all /api routes) ──────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// ── Routes ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Arrowstack JWT Auth Microservice',
    ref: 'AS-2026-7346',
    docs: '/api/health',
    endpoints: {
      auth: '/api/auth/*',
      admin: '/api/admin/*',
      health: '/api/health',
    },
  });
});
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ── Errors ─────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Boot ───────────────────────────────────────────────────
function start() {
  initDb();
  app.listen(config.port, () => {
    console.log(`\n┌─────────────────────────────────────────────────────────┐`);
    console.log(`│  Arrowstack JWT Auth Microservice                       │`);
    console.log(`│  Ref: AS-2026-7346 · Bhumika Gandhi                     │`);
    console.log(`└─────────────────────────────────────────────────────────┘`);
    console.log(`  ▸ Environment : ${config.env}`);
    console.log(`  ▸ Listening   : http://localhost:${config.port}`);
    console.log(`  ▸ Database    : ${config.dbPath}`);
    console.log(`  ▸ Health      : http://localhost:${config.port}/api/health\n`);
  });
}

start();

export default app;
