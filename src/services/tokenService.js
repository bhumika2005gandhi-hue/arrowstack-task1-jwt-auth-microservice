// src/services/tokenService.js
// Refresh-token storage (hashed) + lifecycle helpers.
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { hashToken, decodeTokenExpiry } from '../utils/jwt.js';

export function storeRefreshToken(userId, token) {
  const id = uuidv4();
  const expiresAt = decodeTokenExpiry(token) || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  getDb()
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, userId, hashToken(token), expiresAt);
  return id;
}

export function isRefreshTokenValid(token) {
  const row = getDb()
    .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?')
    .get(hashToken(token));

  if (!row) return false;
  if (row.revoked === 1) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  return row;
}

export function revokeRefreshToken(token) {
  getDb()
    .prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?')
    .run(hashToken(token));
}

export function revokeAllUserTokens(userId) {
  getDb()
    .prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?')
    .run(userId);
}
