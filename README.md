# Task 1 · Role-Based User Authentication & JWT Microservice

> **Arrowstack Technologies — Virtual Internship, Batch 2026**
> Domain: Full Stack Development (Technical Track · Advanced)
> Ref ID: `AS-2026-7346` · Intern: **Bhumika Gandhi**
> Tenure: Aug 22, 2026 → Sep 22, 2026

A production-grade, dependency-light authentication microservice built with **Node.js, Express, SQLite, and JSON Web Tokens**. Implements **role-based access control (RBAC)** with access + refresh-token rotation, password hashing, rate limiting, helmet security headers, and Zod-validated input.

---

## ✨ Features

| Capability | Implementation |
|---|---|
| User registration | `POST /api/auth/register` — bcrypt-hashed passwords, unique email + username |
| Login | `POST /api/auth/login` — issues access + refresh token pair |
| Token rotation | `POST /api/auth/refresh` — old refresh token revoked, new pair issued |
| Logout (single) | `POST /api/auth/logout` — revokes the supplied refresh token |
| Logout (all devices) | `POST /api/auth/logout-all` — revokes every session for the user |
| Current user | `GET /api/auth/me` — protected, returns the JWT-bearing user |
| Change password | `POST /api/auth/change-password` — invalidates all existing sessions |
| Role-based access | `authenticate` + `authorize('admin' \| 'moderator')` middleware |
| Admin: list/get users | `GET /api/admin/users`, `GET /api/admin/users/:id` |
| Admin: change role | `PATCH /api/admin/users/:id/role` |
| Admin: activate/deactivate | `PATCH /api/admin/users/:id/status` |

### Three-tier role hierarchy

```
user        ← default, can manage own profile
moderator   ← can read user lists, no destructive mutations
admin       ← full control over roles + active status
```

Higher roles inherit lower-role privileges automatically.

---

## 🏗️ Architecture

```
src/
├── config/          # Environment loader
├── db/              # SQLite connection + schema (better-sqlite3)
├── middleware/      # auth (JWT+RBAC), validation, errors
├── routes/          # /api/auth, /api/admin, /api/health
├── controllers/     # request handlers (thin)
├── services/        # userService, tokenService (business logic)
├── validators/      # Zod schemas
├── utils/           # JWT helpers, API response helpers
├── seed.js           # Demo users
└── server.js         # Express bootstrap
```

**Why these choices?**
- **SQLite + better-sqlite3** — zero-config, file-based, perfect for a self-contained microservice demo. Swap the persistence layer in `src/services/*` to migrate to Postgres/MySQL.
- **Access (15 min) + refresh (7 d) tokens** — short-lived access tokens limit blast radius; refresh tokens are stored **hashed** in DB so a DB leak ≠ usable tokens.
- **bcryptjs** — battle-tested password hashing (10 rounds).
- **Helmet + express-rate-limit** — defense-in-depth defaults baked into the bootstrap.
- **Zod** — compile-time-safe schema validation, descriptive error messages.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# (optional) edit .env to change secrets, port, token lifetimes

# 3. Seed demo users
npm run seed

# 4. Start the server
npm start          # production-style
# or
npm run dev        # auto-restarts on file changes (Node 18+ --watch)
```

The server boots at **http://localhost:4000**.

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| admin | `admin@arrowstack.org` | `Admin@12345` |
| moderator | `moderator@arrowstack.org` | `Moderator@123` |
| user | `user@arrowstack.org` | `User@12345` |

---

## 📡 API Reference

Base URL: `http://localhost:4000`

### Authentication Endpoints

#### `POST /api/auth/register`
```jsonc
// Request body
{ "email": "you@example.com", "username": "you", "password": "Strong@123" }

// Response 201
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "username": "...", "role": "user" },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

**Password rules:** ≥ 8 chars, ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit.

#### `POST /api/auth/login`
```jsonc
// Request
{ "email": "admin@arrowstack.org", "password": "Admin@12345" }

// Response 200
{ "success": true, "data": { "user": {...}, "tokens": {...} } }
```

#### `POST /api/auth/refresh`
```jsonc
{ "refreshToken": "<refresh-token-from-login>" }
// → returns a NEW access+refresh pair, old refresh token is revoked
```

#### `GET /api/auth/me` *(protected)*
```http
Authorization: Bearer <access-token>
```

#### `POST /api/auth/change-password` *(protected)*
```jsonc
{ "currentPassword": "...", "newPassword": "NewerStronger@1" }
```
All existing sessions are revoked — user must log in again.

#### `POST /api/auth/logout` · `POST /api/auth/logout-all` *(protected)*
Revoke a single refresh token, or all of the user's sessions.

### Admin Endpoints *(require moderator+ or admin role)*

| Method | Route | Required role |
|---|---|---|
| `GET` | `/api/admin/users` | moderator+ |
| `GET` | `/api/admin/users/:id` | moderator+ |
| `PATCH` | `/api/admin/users/:id/role` | admin |
| `PATCH` | `/api/admin/users/:id/status` | admin |

### Health
- `GET /api/health` — service status
- `GET /api/health/db` — DB connectivity check

---

## 🧪 Manual Test (curl)

```bash
BASE=http://localhost:4000

# 1. Register
curl -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@arrowstack.org","username":"demo","password":"Demo@12345"}'

# 2. Login
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arrowstack.org","password":"Admin@12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])")

# 3. Access protected route
curl $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"

# 4. Admin-only action
curl $BASE/api/admin/users -H "Authorization: Bearer $TOKEN"
```

A ready-to-import Postman collection lives at `docs/postman_collection.json`.

---

## 🔐 Security Highlights

- ✅ Passwords hashed with **bcrypt** (10 rounds)
- ✅ JWT access tokens short-lived (15 min default)
- ✅ Refresh tokens stored **hashed (SHA-256)** in DB — never plaintext
- ✅ Refresh-token **rotation** on every refresh
- ✅ Changing password / deactivating a user **revokes all sessions**
- ✅ **Helmet** for secure HTTP headers
- ✅ **express-rate-limit** caps abuse (100 req / 15 min / IP by default)
- ✅ **Zod** validates every input — rejects malformed JSON early
- ✅ **CORS** configurable via env var
- ✅ Role checks enforced **server-side**, not client-side

---

## 📂 Project Layout

```
arrowstack-task1-jwt-auth-microservice/
├── src/
│   ├── config/index.js
│   ├── db/index.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + RBAC
│   │   ├── validate.js        # Zod body validator
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── health.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── adminController.js
│   ├── services/
│   │   ├── userService.js
│   │   └── tokenService.js
│   ├── validators/schemas.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── apiResponse.js
│   ├── seed.js
│   └── server.js
├── docs/
│   ├── postman_collection.json
│   └── README.md  (you are here)
├── tests/
├── data/                      # auto-created SQLite DB
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js ≥ 18 | LTS, native ES modules, `--watch` |
| Framework | Express 4 | Minimal, ubiquitous, easy to extend |
| Database | SQLite (better-sqlite3) | File-based, zero-config, synchronous API |
| Auth | jsonwebtoken | Industry-standard JWT lib |
| Hashing | bcryptjs | Pure-JS bcrypt, no native build pain |
| Validation | Zod | Type-safe schemas, great DX |
| Security | helmet, express-rate-limit, cors | Sensible defaults out of the box |
| Logging | morgan | Minimal HTTP request logs |

---

## 📋 Roadmap (Stretch Goals)

- [ ] Email verification on registration
- [ ] OAuth2 social login (Google / GitHub)
- [ ] 2FA via TOTP
- [ ] Migration to PostgreSQL with Prisma
- [ ] OpenAPI/Swagger auto-generated docs

---

## 👩‍💻 Author

**Bhumika Gandhi**
- Email: bhumika2005gandhi@gmail.com
- Roll/App ID: AS-2026-7346
- Institution: Jagannath Community College
- Cohort: Arrowstack Batch 2026 (Full Stack Development)

---

## 📜 License

MIT — for educational use under the Arrowstack Technologies internship program.

---

> *Built as part of Arrowstack Batch 2026 Full Stack Development Internship — Ref: AS-2026-7346*
