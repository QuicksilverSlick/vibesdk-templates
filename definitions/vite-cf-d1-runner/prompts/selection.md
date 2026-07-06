# Template Selection

A full-stack Vite/React app on Cloudflare Workers backed by a **real D1 (SQLite) database** through Drizzle ORM, with **email/password authentication** already wired via better-auth. The database is bound live in preview, so any data created while building — accounts, records, uploads — is real and carries straight through to production. No rebuild, no separate staging database.

Use when:
- The app stores persistent, structured, relational data (users, posts, orders, bookings, messages, tasks…)
- The app has (or might grow) user accounts, sign-in, or per-user data
- You want a genuine SQL database and query layer, not key-value or in-memory storage
- SaaS apps, dashboards, CRMs, marketplaces, social apps, internal tools

Prefer this over the Durable-Object storage template whenever the data is relational or the app needs authentication.

Avoid when:
- Static sites / SPAs with no backend or persistence
- SEO/SSR landing pages
- Realtime coordination as the core need (websockets, presence, live cursors) with little relational data — a Durable Object fits better

Built with:
- React Router, ShadCN UI, Tailwind, Lucide Icons, ESLint, Vite
- Cloudflare Workers + Hono
- Cloudflare D1 (SQLite) + Drizzle ORM
- better-auth (email + password) on the same D1
