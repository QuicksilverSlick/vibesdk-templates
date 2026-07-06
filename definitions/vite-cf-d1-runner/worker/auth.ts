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

export function createAuth(env: Env) {
	const db = drizzle(env.DB, { schema });
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
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.BETTER_AUTH_URL],
		emailAndPassword: { enabled: true },
		// Cookie Secure flag is derived from BETTER_AUTH_URL's protocol
		// automatically (secure on https preview/prod, non-secure on http local),
		// so useSecureCookies is intentionally left unset.
		//
		// crossSubDomainCookies is intentionally NOT enabled: every generated app
		// shares the *.app.getdreamforge.com parent domain, so a domain-scoped
		// cookie would leak sessions between different apps. Host-only cookies
		// (the default) keep each app's sessions isolated.
	});
}
