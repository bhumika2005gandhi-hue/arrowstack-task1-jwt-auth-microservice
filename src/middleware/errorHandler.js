// src/middleware/errorHandler.js
// Global error + 404 handler.
import { sendError } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  if (statusCode >= 500) {
    console.error('[error]', err);
  }
  return sendError(res, statusCode, message, err.details || null);
}
