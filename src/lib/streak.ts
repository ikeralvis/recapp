import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { entries } from '../db/schema';

function toUtcDateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

/** Días consecutivos (hasta hoy o ayer) con al menos una entrada registrada. */
export async function getCurrentStreak(categoryId: number, userId: number, personalOnly: boolean): Promise<number> {
	const scopeCondition = personalOnly
		? and(eq(entries.categoryId, categoryId), eq(entries.userId, userId))
		: eq(entries.categoryId, categoryId);

	const rows = await db
		.select({ occurredAt: entries.occurredAt })
		.from(entries)
		.where(scopeCondition)
		.orderBy(desc(entries.occurredAt))
		.limit(400);

	const days = new Set(rows.map((r) => toUtcDateKey(r.occurredAt)));

	const cursor = new Date();
	cursor.setUTCHours(0, 0, 0, 0);
	// Si hoy todavía no hay entrada, la racha puede seguir contando desde ayer
	// (se rompe solo si tampoco hay nada ayer).
	if (!days.has(toUtcDateKey(cursor))) {
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}

	let streak = 0;
	while (days.has(toUtcDateKey(cursor))) {
		streak++;
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}

	return streak;
}
