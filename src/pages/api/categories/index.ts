import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { categories } from '../../../db/schema';
import { validateFields } from '../../../lib/categoryField';
import { listAccessibleCategories } from '../../../lib/categoryAccess';
import { isGroupMember } from '../../../lib/group';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	return Response.json(await listAccessibleCategories(locals.user.id));
};

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const icon = typeof body?.icon === 'string' ? body.icon.trim() : null;
	const kind = body?.kind === 'counter' || body?.kind === 'detailed' ? body.kind : null;
	const fields = body?.fields ?? [];
	const ownerType = body?.ownerType === 'group' ? 'group' : 'user';
	const groupId = Number(body?.groupId);
	const visibility = ownerType === 'group' && body?.visibility === 'shared' ? 'shared' : 'individual';

	if (!name || !kind) {
		return Response.json({ error: 'Nombre y tipo (contador/detallada) son obligatorios.' }, { status: 400 });
	}

	if (kind === 'detailed' && !validateFields(fields)) {
		return Response.json({ error: 'Los campos configurados no son válidos.' }, { status: 400 });
	}

	if (ownerType === 'group') {
		if (!Number.isInteger(groupId) || !(await isGroupMember(groupId, locals.user.id))) {
			return Response.json({ error: 'Selecciona un grupo del que seas miembro.' }, { status: 400 });
		}
	}

	const inserted = await db
		.insert(categories)
		.values({
			ownerType,
			ownerId: ownerType === 'group' ? groupId : locals.user.id,
			name,
			icon,
			kind,
			visibility,
			schemaJson: kind === 'detailed' ? fields : [],
			createdBy: locals.user.id,
			createdAt: new Date(),
		})
		.returning()
		.get();

	return Response.json(inserted, { status: 201 });
};
