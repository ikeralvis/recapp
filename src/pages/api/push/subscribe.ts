import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pushSubscriptions } from '../../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
	const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
	const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';

	if (!endpoint || !p256dh || !auth) {
		return Response.json({ error: 'Suscripción inválida.' }, { status: 400 });
	}

	const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).get();
	if (existing) {
		await db
			.update(pushSubscriptions)
			.set({ userId: locals.user.id, p256dh, auth })
			.where(eq(pushSubscriptions.endpoint, endpoint));
	} else {
		await db.insert(pushSubscriptions).values({ userId: locals.user.id, endpoint, p256dh, auth, createdAt: new Date() });
	}

	return Response.json({ ok: true });
};
