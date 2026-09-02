import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { users } from '../../../db/schema';
import { hashPassword, signSession, SESSION_COOKIE } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const password = typeof body?.password === 'string' ? body.password : '';
	const name = typeof body?.name === 'string' ? body.name.trim() : '';

	const passwordValid =
		password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);

	if (!email || !name || !passwordValid) {
		return Response.json(
			{ error: 'La contraseña necesita 8+ caracteres, una letra, un número y un carácter especial.' },
			{ status: 400 }
		);
	}

	const existing = await db.select().from(users).where(eq(users.email, email)).get();
	if (existing) {
		return Response.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 });
	}

	const passwordHash = await hashPassword(password);
	const inserted = await db
		.insert(users)
		.values({ email, name, passwordHash, createdAt: new Date() })
		.returning()
		.get();

	const token = await signSession(
		{ sub: String(inserted.id), email: inserted.email, name: inserted.name, accentColor: inserted.accentColor },
		import.meta.env.JWT_SECRET
	);
	cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});

	return Response.json({ id: inserted.id, email: inserted.email, name: inserted.name });
};
