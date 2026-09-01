import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { entries } from '../../../db/schema';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const id = Number(params.id);
	if (!Number.isInteger(id)) {
		return Response.json({ error: 'Id inválido.' }, { status: 400 });
	}

	const entry = await db.select().from(entries).where(eq(entries.id, id)).get();
	if (!entry || entry.userId !== locals.user.id) {
		return Response.json({ error: 'Entrada no encontrada.' }, { status: 404 });
	}

	await db.delete(entries).where(and(eq(entries.id, id), eq(entries.userId, locals.user.id)));

	return Response.json({ ok: true });
};
