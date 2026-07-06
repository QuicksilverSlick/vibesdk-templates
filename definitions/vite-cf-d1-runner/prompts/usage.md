# Usage

## Overview
Cloudflare Workers + React with a **real D1 (SQLite) database** and **email/password auth** already wired.
- Frontend: React Router 6 + TypeScript + ShadCN UI
- Backend: Hono Worker
- Database: Cloudflare D1 via Drizzle ORM (`worker/db/schema.ts`)
- Auth: better-auth on the same D1, mounted at `/api/auth/*`

The database is bound with `remote: true`, so **the preview you build against is the real database**. Anything you or a tester creates while building — accounts, records — persists into production on deploy. There is no separate staging DB and no data migration step.

## ⚠️ IMPORTANT: Demo Content
The `tasks` table, the `/api/tasks` routes, and `src/lib/api-client.ts` are an **example** of an authenticated per-user resource. Replace them with your app's real tables and routes. Keep the `user`/`session`/`account`/`verification` tables — better-auth requires them.

## Authentication — use it only when the app needs accounts
better-auth is fully wired and ready, but **do not add login/signup UI to an app that doesn't need user accounts.** Decide from what you're building:
- A personal tool, a calculator, a single-user dashboard, a static-feeling app → **skip auth entirely.** Just use the database; don't render sign-in.
- A multi-user app, anything with "my" data, accounts, sharing, or per-person state → **use auth.** Add sign-up/sign-in screens with `@/lib/auth-client` and gate your data routes on the session (see `worker/userRoutes.ts`).

When you do need it:
- Client: `import { signIn, signUp, signOut, useSession } from '@/lib/auth-client';`
- Server: `const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });` then `session.user.id`.
- Sign-up/sign-in are email + password out of the box. Social providers are off; enable them in `worker/auth.ts` only if asked.

## The database
- **Schema**: `worker/db/schema.ts` (Drizzle). Add tables here. Foreign-key user-owned rows to `user.id`.
- **Queries**: `const db = drizzle(c.env.DB, { schema });` then Drizzle query builder (`db.select()...`, `db.insert()...`). Never hand-write raw SQL with string interpolation.
- **Migrations**: after changing the schema, run `bun run db:generate` (writes SQL to `migrations/`) then `bun run db:migrate:remote` (applies it to the real D1). The initial migration (`migrations/0001_init.sql`) is already applied at provision time.

## Development Restrictions
- **CANNOT modify `wrangler.jsonc`** — the `DB` binding, `remote: true`, and `nodejs_compat` are required and hidden from you.
- **CANNOT modify `worker/core-utils.ts`** — it declares the `Env` (DB, auth secret, auth URL).
- **CANNOT modify `worker/index.ts`** — add routes in `worker/userRoutes.ts` only.
- **Tailwind Colors**: hardcode custom colors in `tailwind.config.js`, NOT in `index.css`.
- **Components**: use existing ShadCN components; import icons from `lucide-react`.
- **Error Handling**: ErrorBoundary components are pre-implemented.

## Code Organization
### Backend (`worker/`)
- `worker/userRoutes.ts` — your API routes (+ the auth mount and example tasks routes)
- `worker/auth.ts` — the `createAuth(env)` factory (per-request)
- `worker/db/schema.ts` — Drizzle tables (auth tables + your tables)
- `worker/core-utils.ts` — `Env` type (do not edit)

### Frontend (`src/`)
- `src/lib/auth-client.ts` — better-auth React client (sign-in/up/out, `useSession`)
- `src/lib/api-client.ts` — example typed fetch helper for your JSON API
- `src/pages/`, `src/components/` — your UI (ShadCN + Tailwind)

## Secrets
`BETTER_AUTH_SECRET` is provided as a secret (not in `wrangler.jsonc`). `BETTER_AUTH_URL` is set to the app's real origin by the platform. You never manage these.
