// src/routes/health.js
import { Router } from 'express';
import { getDb } from '../db/index.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  return sendSuccess(res, {
    status: 'operational',
    service: 'arrowstack-jwt-auth-microservice',
    version: '1.0.0',
    ref: 'AS-2026-7346',
    time: new Date().toISOString(),
  }, 'Service is healthy');
});

router.get('/db', (req, res) => {
  try {
    const db = getDb();
    const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return sendSuccess(res, { connected: true, users: count }, 'DB health OK');
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
