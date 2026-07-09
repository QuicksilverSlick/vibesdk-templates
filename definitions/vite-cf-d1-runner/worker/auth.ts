/**
 * better-auth instance, built per request.
 *
 * A fresh instance is created for every request rather than a module-level
 * singleton: a D1 handle cached across requests can deadlock on the SQLite
 * write lock in the Workers runtime.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import type { Env } from './core-utils';
import * as schema from './db/schema';

/**
 * The app's own public origin — the ONLY origin better-auth trusts, so a
 * sibling preview app can never drive authenticated requests against this one.
 *
 * The SAME build is served at two hosts: its deployed host and its sandbox
 * preview host (both under `app.getdreamforge.com`). In production the platform
 * injects the exact origin as an https `BETTER_AUTH_URL` at deploy — use it.
 *
 * In the preview sandbox the platform proxy REWRITES the request URL to
 * `http://localhost:<port>` before it reaches this worker, so `request.url`
 * never carries the public host — the proxy delivers it in `X-Forwarded-Host`
 * instead (and the proxy's value always overrides anything client-supplied,
 * so within the sandbox this header is authoritative). Accept it only when it
 * is one of our platform subdomains, and pin the scheme to https: those hosts
 * are only ever publicly served over TLS, and the browser's Origin header is
 * `https://…` — better-auth's trusted-origin comparison is exact-match
 * including scheme, so deriving `http://…` (or falling back to the localhost
 * default, as before this fix) makes every cookie-carrying signup 403 with
 * "Invalid origin". Local `bun dev` / any unrecognized host falls back to
 * `BETTER_AUTH_URL`.
 */
function resolveOwnOrigin(env: Env, request: Request): string {
	if (/^https:\/\//i.test(env.BETTER_AUTH_URL ?? '')) {
		return env.BETTER_AUTH_URL;
	}
	let host = request.headers.get('X-Forwarded-Host');
	if (!host) {
		try {
			host = new URL(request.url).hostname;
		} catch {
			host = null;
		}
	}
	if (host && (host === 'app.getdreamforge.com' || host.endsWith('.app.getdreamforge.com'))) {
		return `https://${host}`;
	}
	return env.BETTER_AUTH_URL;
}

// `request` is REQUIRED: in the preview sandbox the app's origin can only be
// learned from the incoming request, so every call must thread it (e.g.
// `createAuth(c.env, c.req.raw)`). Making it required fails the build loudly if
// a route omits it, rather than silently falling back to the localhost default
// and breaking auth in preview.
export function createAuth(env: Env, request: Request) {
	const db = drizzle(env.DB, { schema });
	const origin = resolveOwnOrigin(env, request);
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		baseURL: origin,
		secret: env.BETTER_AUTH_SECRET,
		// Trust ONLY this app's own origin. Every generated app lives under
		// app.getdreamforge.com, so siblings are SAME-site with each other
		// (SameSite=Lax does not separate registrable-domain siblings) — a wildcard
		// trusted origin would let one preview app drive authenticated,
		// state-changing requests against another. Pinning to the resolved
		// own-origin closes that cross-app CSRF path.
		trustedOrigins: [origin],
		emailAndPassword: { enabled: true },
		// Cookie Secure flag is derived from baseURL's protocol automatically
		// (secure on the https preview/prod hosts, non-secure on http local), so
		// useSecureCookies is intentionally left unset.
		//
		// crossSubDomainCookies is intentionally NOT enabled: sibling apps share the
		// app.getdreamforge.com parent domain, so a domain-scoped cookie would leak
		// sessions between apps. Host-only cookies (the default) keep them isolated.
	});
}
