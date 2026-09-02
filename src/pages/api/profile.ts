import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { isAvatarColor, DEFAULT_AVATAR_COLOR } from '../../lib/avatarColors';
import { isDicebearStyle } from '../../lib/avatar';
import { signSession, SESSION_COOKIE } from '../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}
	const user = await db.select().from(users).where(eq(users.id, locals.user.id)).get();
	return Response.json(user);
};

export const PUT: APIRoute = async ({ request, locals, cookies }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	const avatarColor = typeof body?.avatarColor === 'string' && isAvatarColor(body.avatarColor) ? body.avatarColor : DEFAULT_AVATAR_COLOR;
	const avatarStyle = typeof body?.avatarStyle === 'string' && isDicebearStyle(body.avatarStyle) ? body.avatarStyle : null;
	const avatarSeed = typeof body?.avatarSeed === 'string' ? body.avatarSeed.slice(0, 64) : '';
	const accentColor = typeof body?.accentColor === 'string' && isAvatarColor(body.accentColor) ? body.accentColor : DEFAULT_AVATAR_COLOR;

	if (!name) {
		return Response.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
	}

	const updated = await db
		.update(users)
		.set({ name, avatarColor, avatarStyle, avatarSeed, accentColor })
		.where(eq(users.id, locals.user.id))
		.returning()
		.get();

	// El acento va metido en la cookie de sesión (para no consultar la DB en cada página),
	// así que hay que reemitirla para que el cambio se vea sin tener que volver a iniciar sesión.
	const token = await signSession(
		{ sub: String(updated.id), email: updated.email, name: updated.name, accentColor: updated.accentColor },
		import.meta.env.JWT_SECRET
	);
	cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});

	return Response.json(updated);
};
