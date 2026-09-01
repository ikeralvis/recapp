import { defineMiddleware } from 'astro:middleware';
import { verifySession, SESSION_COOKIE } from './lib/auth';

const PROTECTED_PREFIXES = ['/app'];

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.user = null;

	const token = context.cookies.get(SESSION_COOKIE)?.value;
	if (token) {
		try {
			const payload = await verifySession(token, import.meta.env.JWT_SECRET);
			context.locals.user = {
				id: Number(payload.sub),
				email: payload.email,
				name: payload.name,
			};
		} catch {
			context.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const isProtected = PROTECTED_PREFIXES.some((prefix) => context.url.pathname.startsWith(prefix));
	if (isProtected && !context.locals.user) {
		const redirectTo = context.url.pathname + context.url.search;
		return context.redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
	}

	return next();
});
