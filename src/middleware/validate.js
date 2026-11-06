// src/middleware/validate.js
// Zod schema validator for request body.
import { sendError } from '../utils/apiResponse.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return sendError(res, 422, 'Validation failed', details);
    }
    req.body = result.data;
    return next();
  };
}
