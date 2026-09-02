import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pushSubscriptions } from '../../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
	if (!endpoint) {
		return Response.json({ error: 'endpoint requerido.' }, { status: 400 });
	}

	await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, locals.user.id)));

	return Response.json({ ok: true });
};
