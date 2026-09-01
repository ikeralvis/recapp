import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { users } from '../../../db/schema';
import { verifyPassword, signSession, SESSION_COOKIE } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!email || !password) {
		return Response.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 });
	}

	const user = await db.select().from(users).where(eq(users.email, email)).get();
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		return Response.json({ error: 'Credenciales inválidas.' }, { status: 401 });
	}

	const token = await signSession(
		{ sub: String(user.id), email: user.email, name: user.name },
		import.meta.env.JWT_SECRET
	);
	cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});

	return Response.json({ id: user.id, email: user.email, name: user.name });
};
