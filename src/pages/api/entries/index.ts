import type { APIRoute } from 'astro';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { categories, entries, users } from '../../../db/schema';
import { canAccessCategory, isPersonalView } from '../../../lib/categoryAccess';
import { validateEntryData } from '../../../lib/entryData';
import type { CategoryField } from '../../../lib/categoryField';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const categoryId = Number(url.searchParams.get('categoryId'));
	if (!Number.isInteger(categoryId)) {
		return Response.json({ error: 'categoryId inválido.' }, { status: 400 });
	}

	const category = await db.select().from(categories).where(eq(categories.id, categoryId)).get();
	if (!category || !(await canAccessCategory(locals.user.id, category))) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	const personalOnly = isPersonalView(category);

	const rows = await db
		.select({
			id: entries.id,
			occurredAt: entries.occurredAt,
			dataJson: entries.dataJson,
			createdAt: entries.createdAt,
			userId: entries.userId,
			userName: users.name,
		})
		.from(entries)
		.innerJoin(users, eq(users.id, entries.userId))
		.where(personalOnly ? and(eq(entries.categoryId, categoryId), eq(entries.userId, locals.user.id)) : eq(entries.categoryId, categoryId))
		.orderBy(desc(entries.occurredAt))
		.limit(100);

	return Response.json(rows);
};

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const categoryId = Number(body?.categoryId);
	if (!Number.isInteger(categoryId)) {
		return Response.json({ error: 'categoryId inválido.' }, { status: 400 });
	}

	const category = await db.select().from(categories).where(eq(categories.id, categoryId)).get();
	if (!category || !(await canAccessCategory(locals.user.id, category))) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date();
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

	const inserted = await db
		.insert(entries)
		.values({
			categoryId,
			userId: locals.user.id,
			groupId: category.ownerType === 'group' ? category.ownerId : null,
			occurredAt,
			dataJson: data,
			createdAt: new Date(),
		})
		.returning()
		.get();

	return Response.json(inserted, { status: 201 });
};
