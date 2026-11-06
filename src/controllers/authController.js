// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  comparePassword,
  updateUserLastLogin,
  sanitize,
} from '../services/userService.js';
import {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/tokenService.js';
import { getDb } from '../db/index.js';
import { ApiError, sendSuccess } from '../utils/apiResponse.js';

function issueTokenPair(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id, jti: uuidv4() });
  storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

export const authController = {
  // POST /api/auth/register
  register(req, res, next) {
    try {
      const user = createUser(req.body);
      const tokens = issueTokenPair(user);
      return sendSuccess(
        res,
        { user, tokens },
        'User registered successfully',
        201
      );
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/auth/login
  login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = findUserByEmail(email.toLowerCase());
      if (!user || !comparePassword(password, user.password_hash)) {
        throw new ApiError(401, 'Invalid credentials');
      }
      if (!user.is_active) {
        throw new ApiError(403, 'Account is deactivated');
      }
      updateUserLastLogin(user.id);
      const tokens = issueTokenPair(user);
      return sendSuccess(res, { user: sanitize(user), tokens }, 'Login successful');
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/auth/refresh
  refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const stored = isRefreshTokenValid(refreshToken);
      if (!stored) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        throw new ApiError(401, 'Refresh token signature invalid');
      }
      // Rotate: revoke old, issue new pair.
      revokeRefreshToken(refreshToken);
      const user = sanitize(findUserById(payload.sub));
      if (!user) throw new ApiError(404, 'User no longer exists');
      const tokens = issueTokenPair(user);
      return sendSuccess(res, { user, tokens }, 'Token refreshed');
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/auth/logout
  logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) revokeRefreshToken(refreshToken);
      return sendSuccess(res, null, 'Logged out');
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/auth/logout-all
  logoutAll(req, res, next) {
    try {
      revokeAllUserTokens(req.user.id);
      return sendSuccess(res, null, 'All sessions revoked');
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/auth/me
  me(req, res, next) {
    try {
      return sendSuccess(res, { user: req.user }, 'Current user');
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/auth/change-password
  changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = findUserByEmail(req.user.email);
      if (!comparePassword(currentPassword, user.password_hash)) {
        throw new ApiError(401, 'Current password is incorrect');
      }
      const newHash = bcrypt.hashSync(newPassword, 10);
      getDb()
        .prepare(
          'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
        )
        .run(newHash, user.id);
      revokeAllUserTokens(user.id);
      return sendSuccess(res, null, 'Password updated. Please log in again.');
    } catch (err) {
      return next(err);
    }
  },
};
