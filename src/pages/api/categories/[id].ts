import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { categories } from '../../../db/schema';
import { validateFields } from '../../../lib/categoryField';
import { canAccessCategory } from '../../../lib/categoryAccess';
import { isGroupMember } from '../../../lib/group';
import { isAvatarColor } from '../../../lib/avatarColors';

export const prerender = false;

async function loadAccessibleCategory(userId: number, idParam: string | undefined) {
	const id = Number(idParam);
	if (!Number.isInteger(id)) return null;

	const category = await db.select().from(categories).where(eq(categories.id, id)).get();
	if (!category || !(await canAccessCategory(userId, category))) return null;
	return category;
}

export const GET: APIRoute = async ({ params, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const category = await loadAccessibleCategory(locals.user.id, params.id);
	if (!category) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	return Response.json(category);
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const category = await loadAccessibleCategory(locals.user.id, params.id);
	if (!category) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const icon = typeof body?.icon === 'string' ? body.icon.trim() : null;
	const color = typeof body?.color === 'string' && isAvatarColor(body.color) ? body.color : category.color;
	const fields = body?.fields ?? [];

	if (!name) {
		return Response.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
	}

	if (category.kind === 'detailed' && !validateFields(fields)) {
		return Response.json({ error: 'Los campos configurados no son válidos.' }, { status: 400 });
	}

	// Solo se permite convertir Personal -> Grupo, nunca al revés (evitaría huérfanar
	// datos de otros miembros que ya viven bajo ese grupo).
	let ownerType = category.ownerType;
	let ownerId = category.ownerId;
	let visibility = category.visibility;

	if (category.ownerType === 'user' && body?.ownerType === 'group') {
		const groupId = Number(body?.groupId);
		if (!Number.isInteger(groupId) || !(await isGroupMember(groupId, locals.user.id))) {
			return Response.json({ error: 'Selecciona un grupo del que seas miembro.' }, { status: 400 });
		}
		ownerType = 'group';
		ownerId = groupId;
		visibility = body?.visibility === 'shared' ? 'shared' : 'individual';
	}

	const updated = await db
		.update(categories)
		.set({
			name,
			icon,
			color,
			schemaJson: category.kind === 'detailed' ? fields : [],
			ownerType,
			ownerId,
			visibility,
		})
		.where(eq(categories.id, category.id))
		.returning()
		.get();

	return Response.json(updated);
};

export const DELETE: APIRoute = async ({ params, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const category = await loadAccessibleCategory(locals.user.id, params.id);
	if (!category) {
		return Response.json({ error: 'Categoría no encontrada.' }, { status: 404 });
	}

	await db.update(categories).set({ archived: true }).where(eq(categories.id, category.id));

	return Response.json({ ok: true });
};
