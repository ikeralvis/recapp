import type { APIRoute } from 'astro';
import { getStatsForPeriod, parsePeriod } from '../../lib/stats';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const periodKey = url.searchParams.get('period') ?? '';
	let period;
	try {
		period = parsePeriod(periodKey);
	} catch {
		return Response.json({ error: 'Periodo inválido.' }, { status: 400 });
	}

	const stats = await getStatsForPeriod(locals.user.id, period);
	return Response.json({ period: { key: period.key, label: period.label, kind: period.kind }, categories: stats });
};
