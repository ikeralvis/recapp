import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { categories, entries } from '../../../db/schema';
import { validateEntryData } from '../../../lib/entryData';
import type { CategoryField } from '../../../lib/categoryField';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

	const category = await db.select().from(categories).where(eq(categories.id, entry.categoryId)).get();
	if (!category) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	const body = await request.json().catch(() => null);
	const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : entry.occurredAt;
	if (Number.isNaN(occurredAt.getTime())) {
		return Response.json({ error: 'Fecha inválida.' }, { status: 400 });
	}

	const data = category.kind === 'detailed' ? (body?.data ?? {}) : {};
	if (category.kind === 'detailed') {
		const fields = category.schemaJson as unknown as CategoryField[];
		const error = validateEntryData(fields, data);
		if (error) {
			return Response.json({ error }, { status: 400 });
		}
	}

	const updated = await db
		.update(entries)
		.set({ occurredAt, dataJson: data })
		.where(and(eq(entries.id, id), eq(entries.userId, locals.user.id)))
		.returning()
		.get();

	return Response.json(updated);
};

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
