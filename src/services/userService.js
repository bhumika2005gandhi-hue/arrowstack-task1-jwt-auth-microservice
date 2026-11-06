// src/services/userService.js
// User persistence + password helpers.
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { ApiError } from '../utils/apiResponse.js';

const BCRYPT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function findUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function findUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function findUserByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function createUser({ email, username, password, role = 'user' }) {
  if (findUserByEmail(email)) {
    throw new ApiError(409, 'Email already registered');
  }
  if (findUserByUsername(username)) {
    throw new ApiError(409, 'Username already taken');
  }

  const id = uuidv4();
  const passwordHash = hashPassword(password);

  getDb()
    .prepare(
      `INSERT INTO users (id, email, username, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, email.toLowerCase(), username, passwordHash, role);

  return sanitize(findUserById(id));
}

export function updateUserLastLogin(userId) {
  getDb()
    .prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?')
    .run(userId);
}

export function updateUserRole(userId, newRole) {
  const result = getDb()
    .prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newRole, userId);

  if (result.changes === 0) {
    throw new ApiError(404, 'User not found');
  }
  return sanitize(findUserById(userId));
}

export function setUserActive(userId, isActive) {
  getDb()
    .prepare(
      'UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?'
    )
    .run(isActive ? 1 : 0, userId);
}

export function listUsers({ limit = 50, offset = 0 } = {}) {
  return getDb()
    .prepare('SELECT id, email, username, role, is_active, created_at FROM users LIMIT ? OFFSET ?')
    .all(limit, offset);
}

export function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}
