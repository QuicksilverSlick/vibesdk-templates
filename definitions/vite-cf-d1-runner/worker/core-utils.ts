/**
 * Core types for the Cloudflare D1 + better-auth template.
 * STRICTLY DO NOT MODIFY THIS FILE - Hidden from AI to prevent breaking core functionality.
 */

export interface Env {
    ASSETS: Fetcher;
    /** The per-app D1 (SQLite) database. Bound with remote: true in wrangler.jsonc. */
    DB: D1Database;
    /** better-auth signing secret. Delivered as a secret (never committed). */
    BETTER_AUTH_SECRET: string;
    /** The public origin this app is served from; drives auth cookies + trusted origins. */
    BETTER_AUTH_URL: string;
}
