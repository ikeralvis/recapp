import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { isAvatarColor, DEFAULT_AVATAR_COLOR } from '../../lib/avatarColors';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}
	const user = await db.select().from(users).where(eq(users.id, locals.user.id)).get();
	return Response.json(user);
};

export const PUT: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const avatarColor = typeof body?.avatarColor === 'string' && isAvatarColor(body.avatarColor) ? body.avatarColor : DEFAULT_AVATAR_COLOR;
	if (!name) {
		return Response.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
	}

	const updated = await db
		.update(users)
		.set({ name, avatarColor })
		.where(eq(users.id, locals.user.id))
		.returning()
		.get();

	return Response.json({ id: updated.id, email: updated.email, name: updated.name, avatarColor: updated.avatarColor });
};
