// src/seed.js
// Seeds demo users (admin + moderator + user) for quick testing.
import { initDb, getDb } from './db/index.js';
import { config } from './config/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const SEED_USERS = [
  {
    email: 'admin@arrowstack.org',
    username: 'admin_bhumika',
    password: 'Admin@12345',
    role: 'admin',
  },
  {
    email: 'moderator@arrowstack.org',
    username: 'mod_bhumika',
    password: 'Moderator@123',
    role: 'moderator',
  },
  {
    email: 'user@arrowstack.org',
    username: 'user_bhumika',
    password: 'User@12345',
    role: 'user',
  },
];

function run() {
  initDb();
  const db = getDb();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO users (id, email, username, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`
  );
  for (const u of SEED_USERS) {
    stmt.run(
      uuidv4(),
      u.email,
      u.username,
      bcrypt.hashSync(u.password, 10),
      u.role
    );
  }
  console.log('✓ Seeded 3 demo users:');
  SEED_USERS.forEach((u) =>
    console.log(`  • ${u.role.padEnd(10)}  ${u.email}  /  ${u.password}`)
  );
  console.log(`\n  Reference: ${config.dbPath}`);
}

run();
