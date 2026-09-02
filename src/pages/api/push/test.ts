import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { pushSubscriptions } from '../../../db/schema';
import { sendPushToUser } from '../../../lib/push';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, locals.user.id));
	if (subs.length === 0) {
		return Response.json({ error: 'No tienes ninguna suscripción activa en este dispositivo.' }, { status: 400 });
	}

	await sendPushToUser(locals.user.id, {
		title: 'RecApp',
		body: 'Esto es una notificación de prueba. ¡Funciona!',
		url: '/app/log',
	});

	return Response.json({ ok: true });
};
