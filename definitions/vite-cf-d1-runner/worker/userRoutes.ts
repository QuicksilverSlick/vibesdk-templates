import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Env } from './core-utils';
import { createAuth } from './auth';
import * as schema from './db/schema';

/**
 * Add your API routes here. **DO NOT MODIFY CORS OR OVERRIDE ERROR HANDLERS.**
 *
 * better-auth owns every `/api/auth/*` route (sign-up, sign-in, sign-out,
 * session). The `/api/tasks` routes below are an example of an authenticated
 * resource keyed to the signed-in user — replace them with your own.
 */
export function userRoutes(app: Hono<{ Bindings: Env }>) {
	app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env, c.req.raw).handler(c.req.raw));

	app.get('/api/tasks', async (c) => {
		const authSession = await createAuth(c.env, c.req.raw).api.getSession({ headers: c.req.raw.headers });
		if (!authSession) return c.json({ success: false, error: 'Unauthorized' }, 401);
		const db = drizzle(c.env.DB, { schema });
		const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, authSession.user.id));
		return c.json({ success: true, data: rows });
	});

	app.post('/api/tasks', async (c) => {
		const authSession = await createAuth(c.env, c.req.raw).api.getSession({ headers: c.req.raw.headers });
		if (!authSession) return c.json({ success: false, error: 'Unauthorized' }, 401);
		const body = await c.req.json<{ title?: string }>();
		const title = body.title?.trim();
		if (!title) return c.json({ success: false, error: 'title is required' }, 400);
		const db = drizzle(c.env.DB, { schema });
		const row = {
			id: crypto.randomUUID(),
			userId: authSession.user.id,
			title,
			completed: false,
			createdAt: new Date(),
		};
		await db.insert(schema.tasks).values(row);
		return c.json({ success: true, data: row });
	});
}
