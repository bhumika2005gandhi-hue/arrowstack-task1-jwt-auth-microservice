// src/middleware/auth.js
// JWT bearer auth + role-based access control (RBAC).
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';
import { findUserById } from '../services/userService.js';

// Order matters: more privileged roles implicitly include lesser ones.
const ROLE_HIERARCHY = ['user', 'moderator', 'admin'];

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return sendError(res, 401, 'Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    const user = findUserById(payload.sub);
    if (!user || !user.is_active) {
      return sendError(res, 401, 'User no longer active');
    }
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Access token expired');
    }
    return sendError(res, 401, 'Invalid access token');
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }
    const userLevel = ROLE_HIERARCHY.indexOf(req.user.role);
    const minRequired = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY.indexOf(r)));

    if (userLevel < minRequired) {
      return sendError(res, 403, `Requires ${allowedRoles.join(' or ')} role`);
    }
    return next();
  };
}
