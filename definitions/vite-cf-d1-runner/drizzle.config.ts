import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config — used only to GENERATE migration SQL from the schema
 * (`bun run db:generate`). Migrations are applied to the real D1 with
 * `wrangler d1 migrations apply` (see package.json scripts), not by drizzle-kit.
 */
export default defineConfig({
	schema: './worker/db/schema.ts',
	out: './migrations',
	dialect: 'sqlite',
});
