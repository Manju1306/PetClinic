

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the API with hot reload via `ts-node-dev` (entry: `src/server.ts`).
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run the built server (`node dist/server.js`).
- `npm run typecheck` — type-check without emitting (`tsc --noEmit`). There is no linter or test runner configured; the `test` script is a placeholder.
- `npm run db:migrate` / `npm run db:migrate:undo` — wired to `sequelize-cli` but no migrations exist in-repo yet; schema is currently created from raw SQL (see below), not migrations.

Database (SQLite, default):
- `scripts/db/run.sh` rebuilds the dev DB by piping `schema.sql` then `data.sql` into `sqlite3 petclinic.db`. It uses bare relative paths, so run it from `scripts/db/sqlite/`. The resulting `petclinic.db` lives at the repo root, which is the path `src/db.ts` opens.
- MySQL equivalents live in `scripts/db/mysql/` (schema/data SQL plus a setup notes file) but the runtime is hardcoded to SQLite — see "Database wiring" below.

Server listens on `PORT` env var (default 3000). `.env` is loaded via `dotenv/config` from `src/server.ts`.

OpenAPI docs:
- Interactive UI: `GET /api/docs`. Raw spec: `GET /api/docs.json`.
- Spec is hand-written at `openapi.yaml` (repo root) and loaded by `src/openapi.ts` via `path.join(__dirname, '..', 'openapi.yaml')` — that path resolves correctly both for `ts-node-dev` (running from `src/`) and `node dist/server.js` (running from `dist/`) because the YAML sits one level above each. **When adding or changing a route, update `openapi.yaml` in the same change** — nothing enforces alignment.

Manual HTTP tests live in `requests.http` (REST Client / JetBrains HTTP client format) covering every endpoint with chained variables and error-path probes. Update it alongside route changes too.

Auth env vars (all optional in dev; **required** in production — `src/auth/config.ts` throws if missing):
- `JWT_ACCESS_SECRET` — signing key for access tokens.
- `JWT_REFRESH_SECRET` — signing key reserved for future refresh-as-JWT use (refresh tokens are currently opaque, so this is unused but validated).
- `JWT_ACCESS_TTL` (default `15m`), `JWT_REFRESH_TTL` (default `30d`), `PASSWORD_RESET_TTL` (default `1h`) — accept the suffixes `s|m|h|d`.
- `APP_URL` — base URL used to build the password-reset link logged to stdout.

## Architecture

This is a TypeScript/Express 5 port of the Spring PetClinic backend. It exposes a REST API over the classic PetClinic schema (owners, pets, vets, specialties, visits, users, roles).

### Entry and composition

- `src/server.ts` — process entry. Calls `sequelize.authenticate()`, then `createApp()`, then `listen`. Wires SIGTERM/SIGINT to a graceful shutdown that closes the HTTP server and the Sequelize connection.
- `src/app.ts` — pure app factory. Mounts `helmet`, `cors`, JSON/urlencoded body parsers, `morgan`, a `/health` route, the OpenAPI docs (`/api/docs.json`, `/api/docs`), then each `/api/<resource>` router, then the `notFoundHandler` and `errorHandler` (order matters — these two must be last). Helmet's `contentSecurityPolicy` is disabled so Swagger UI's inline assets render; the other Helmet protections are still active.
- `src/index.ts` is **not** the entry point. It is a stray scratch file (`console.log("Hello World!")` with a DOM lib reference); do not mistake it for the bootstrap. The real entry is `server.ts`.

### Database wiring

`src/db.ts` does three things on import:
1. Constructs a Sequelize instance hardcoded to `dialect: 'sqlite'`, `storage: './petclinic.db'`. A commented-out Postgres branch using `DATABASE_URL` is preserved but inactive — to switch dialects you must edit this file.
2. Calls `initModels(sequelize)` from `src/models/petclinic.models.ts`, which registers every model and their associations.
3. Re-exports every model (`Owner`, `Pet`, `Vet`, `Specialty`, `VetSpecialty`, `PetType`, `Visit`, `User`, `Role`) so route files import models from `'../db'`, not from `'../models/...'`. Keep that convention when adding new models.

There is no `sequelize.sync()` call (note the dangling `sequelize.sync` expression in `db.ts` — it is read but not invoked). Tables must already exist; create them via `scripts/db/run.sh`.

### Models

All models live in a single file: `src/models/petclinic.models.ts`. They use Sequelize 6's `InferAttributes` / `InferCreationAttributes` for typing — no separate interfaces.

Schema conventions to preserve when editing:
- `tableName` is set explicitly on every model (`owners`, `pets`, `vets`, `specialties`, `vet_specialties`, `types`, `visits`, `users`, `roles`) — the `PetType` model maps to the `types` table (renamed in TS to avoid shadowing the `Type` identifier).
- All columns use snake_case (`first_name`, `birth_date`, `type_id`, etc.). No `timestamps` on any model — the legacy PetClinic schema has no `created_at`/`updated_at`.
- `User` uses a **natural primary key** on `username` (not an auto-increment id). `Role` references it via `username` foreign key with `sourceKey`/`targetKey` overrides — keep these when adding user-related associations.
- `VetSpecialty` is an explicit join model (not just `through: 'vet_specialties'`) because routes manipulate it directly (see Vets routes below).
- SQLite-specific gotcha encoded in `scripts/db/sqlite/schema.sql`: FK enforcement requires `PRAGMA foreign_keys = ON` per connection, and SQLite doesn't auto-index FK columns, so every FK has an explicit `CREATE INDEX`. If you add a model with a FK, mirror the index in the schema file.

### Routes

One router per resource under `src/routes/`, all mounted under `/api/<resource>` by `app.ts`. Every async handler is wrapped in `asyncHandler` from `src/middleware.ts` — Express 5 forwards rejected promises, but the wrapper is still used uniformly; keep that convention rather than relying on bare `async` handlers.

Conventions every route follows:
- Numeric path params go through `parseIntParam(value, name)`, which throws `BadRequestError` on non-integer / negative / leading-zero input.
- Missing records throw `NotFoundError(resource, id)`; validation problems throw `BadRequestError`. Don't return error JSON inline — let `errorHandler` map the throw to a status.
- Includes are declared as a module-level constant per route file (e.g. `ownerInclude`, `petInclude`) and reused across handlers. When adding endpoints, extend the existing include constant rather than redefining inline.

Cross-resource details worth knowing:
- `routes/owners.ts` owns the nested `/api/owners/:ownerId/pets[...]` and `/api/owners/:ownerId/pets/:petId/visits` endpoints. The flat `/api/pets` and `/api/visits` routers handle the non-nested variants. When adding pet- or visit-related endpoints, check both spots first to avoid duplication or drift.
- `routes/vets.ts` manages vet ↔ specialty membership by deleting and re-inserting `VetSpecialty` rows in `syncVetSpecialties`. It accepts both `[1, 2, 3]` and `[{id: 1}, {id: 2}]` shapes for the `specialties` body field via `extractSpecialtyIds`. Preserve both shapes.
- `routes/users.ts` is write-only (POST `/api/users`). Passwords are hashed with `bcryptjs` (cost 10), and user + roles are inserted in a single `sequelize.transaction`. The created user is re-fetched with `attributes: { exclude: ['password'] }` so the hash never goes out over the wire — keep that exclusion on any future user read endpoints.
- `routes/hello.ts1` (note the `.ts1` extension) is an unmounted stub and intentionally not imported by `app.ts`. Leave it or delete it; do not rename to `.ts` without also wiring it up.

### Auth

JWT-based, with **stateless access tokens + stateful refresh tokens**:

- **Access tokens** are JWTs signed with `JWT_ACCESS_SECRET`. They carry `{ username, roles, typ: 'access' }` and `subject = username`. Verified statelessly by `requireAuth` (`src/auth/middleware.ts`), which populates `req.user: { username, roles }` (typed via the global Express augmentation in `src/auth/types.ts`).
- **Refresh tokens** are opaque 32-byte hex strings, not JWTs. Their SHA-256 hash is stored in `refresh_tokens` with `expires_at`, `revoked_at`, and `replaced_by` (for rotation audit). `rotateRefreshToken` revokes the old row, inserts a new one, and re-reads roles from the DB so role changes propagate within one refresh cycle. **Reusing an already-rotated refresh token returns 401** — this is the intended behavior, not a bug.
- **Password reset tokens** live in `password_reset_tokens` (hashed the same way, single-use via `used_at`). Issuance always returns 204 from `POST /auth/password-reset/request` regardless of whether the email exists (no enumeration). Delivery is stubbed at `deliverResetLink` in `src/routes/auth.ts` — it `console.log`s the reset URL. Replace this seam with real email when SMTP is wired up.
- **Password changes and resets** call `revokeAllRefreshTokensForUser`, forcing every other session to re-login. The endpoint that initiated the change gets a fresh pair so the current client stays signed in.

What's public vs. protected (`src/app.ts`):
- Public: `/health`, `/api/docs`, `/api/docs.json`, all `/auth/*` endpoints **except** `/auth/me*` which require auth.
- Protected (all require Bearer access token): every `/api/*` resource router — `owners`, `pets`, `vets`, `pettypes`, `specialties`, `visits`, `users`.

Schema notes:
- `users.email` (nullable, unique) was added on top of the original Spring schema; password reset relies on it. `scripts/db/sqlite/schema.sql` is authoritative for fresh installs. For existing DBs, `ensureAuthSchema` in `src/db.ts` runs on every startup and idempotently adds the column + the auth tables (`refresh_tokens`, `password_reset_tokens`) if missing. **SQLite quirk**: `ALTER TABLE ADD COLUMN ... UNIQUE` is rejected; the function adds the column without `UNIQUE` and creates the unique index separately.
- Signup (`POST /auth/signup`) assigns exactly one role: `ROLE_USER` (constant `DEFAULT_SIGNUP_ROLE` in `routes/auth.ts`). Admin/staff user creation still goes through `POST /api/users`, which is now protected by `requireAuth` only — **it currently lets any authenticated user create users with arbitrary roles**. Apply `requireRole('ROLE_ADMIN')` in `app.ts` when you have admin accounts you trust.

### Error handling

`src/middleware.ts` is the canonical place for cross-cutting HTTP concerns. The central `errorHandler` maps Sequelize errors to HTTP statuses:
- `UniqueConstraintError` → 409 with `details`
- `ForeignKeyConstraintError` → 409
- `ValidationError` → 400 with `details`
- `DatabaseError` → 500 (generic)
- `HttpError` subclasses (`NotFoundError`, `BadRequestError`) → their own `status`
- Everything else → 500 with `console.error` of the original

When introducing a new error class, extend `HttpError` so the handler picks up the status automatically. `UnauthorizedError` (401) and `ForbiddenError` (403) in `src/auth/middleware.ts` already do this.
