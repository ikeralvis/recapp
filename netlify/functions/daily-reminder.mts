import type { Config } from '@netlify/functions';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { and, eq, gte } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { sendPushToUser } from '../../src/lib/push';

export default async () => {
	const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
	const db = drizzle(client, { schema });

	const startOfToday = new Date();
	startOfToday.setUTCHours(0, 0, 0, 0);

	const subscribedUsers = await db.selectDistinct({ userId: schema.pushSubscriptions.userId }).from(schema.pushSubscriptions);

	for (const { userId } of subscribedUsers) {
		const todaysEntries = await db
			.select({ id: schema.entries.id })
			.from(schema.entries)
			.where(and(eq(schema.entries.userId, userId), gte(schema.entries.occurredAt, startOfToday)));

		const body =
			todaysEntries.length === 0
				? 'Todavía no has registrado nada hoy. ¡No se te olvide!'
				: `Hoy llevas ${todaysEntries.length} ${todaysEntries.length === 1 ? 'entrada' : 'entradas'}. ¡Buen ritmo!`;

		await sendPushToUser(userId, { title: 'RecApp', body, url: '/app/log' });
	}

	return new Response('ok');
};

export const config: Config = {
	// 19:00 UTC ≈ 20:00-21:00 hora de España (según horario de verano). Ajustable.
	schedule: '0 19 * * *',
};
