// src/controllers/adminController.js
// Admin / moderator endpoints — RBAC enforced at route level.
import {
  listUsers,
  findUserById,
  updateUserRole,
  setUserActive,
  sanitize,
} from '../services/userService.js';
import { revokeAllUserTokens } from '../services/tokenService.js';
import { ApiError, sendSuccess } from '../utils/apiResponse.js';

export const adminController = {
  // GET /api/admin/users
  listUsers(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
      const offset = parseInt(req.query.offset || '0', 10);
      const users = listUsers({ limit, offset });
      return sendSuccess(res, { users, count: users.length }, 'User list');
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/admin/users/:id
  getUser(req, res, next) {
    try {
      const user = findUserById(req.params.id);
      if (!user) throw new ApiError(404, 'User not found');
      return sendSuccess(res, { user: sanitize(user) }, 'User detail');
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /api/admin/users/:id/role
  changeRole(req, res, next) {
    try {
      const target = findUserById(req.params.id);
      if (!target) throw new ApiError(404, 'User not found');
      if (req.user.id === target.id) {
        throw new ApiError(400, 'Cannot change your own role');
      }
      const updated = updateUserRole(target.id, req.body.role);
      return sendSuccess(res, { user: updated }, 'Role updated');
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /api/admin/users/:id/status
  toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const target = findUserById(req.params.id);
      if (!target) throw new ApiError(404, 'User not found');
      if (req.user.id === target.id) {
        throw new ApiError(400, 'Cannot deactivate yourself');
      }
      setUserActive(target.id, !!isActive);
      if (!isActive) revokeAllUserTokens(target.id);
      return sendSuccess(res, null, `User ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      return next(err);
    }
  },
};
