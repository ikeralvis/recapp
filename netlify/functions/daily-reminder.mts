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
			.where(and(eq(schema.entries.userId, userId), gte(schema.entries.occurredAt, startOfToday)))
			.limit(1);

		if (todaysEntries.length === 0) {
			await sendPushToUser(userId, {
				title: 'RecApp',
				body: 'Todavía no has registrado nada hoy. ¡No se te olvide!',
				url: '/app/log',
			});
		}
	}

	return new Response('ok');
};

export const config: Config = {
	// 20:00 UTC ≈ 21:00-22:00 hora de España (según horario de verano). Ajustable.
	schedule: '0 20 * * *',
};
