import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { entries, groupMembers, trophies, users } from '../db/schema';
import { listAccessibleCategories } from './categoryAccess';
import type { CategoryField } from './categoryField';

export type Period = { key: string; kind: 'month' | 'year'; start: Date; end: Date; label: string };

const MONTH_LABELS = [
	'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
	'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function parsePeriod(periodKey: string): Period {
	const monthMatch = /^(\d{4})-(\d{2})$/.exec(periodKey);
	if (monthMatch) {
		const year = Number(monthMatch[1]);
		const month = Number(monthMatch[2]) - 1;
		const start = new Date(Date.UTC(year, month, 1));
		const end = new Date(Date.UTC(year, month + 1, 1));
		return { key: periodKey, kind: 'month', start, end, label: `${MONTH_LABELS[month]} ${year}` };
	}

	const yearMatch = /^(\d{4})$/.exec(periodKey);
	if (yearMatch) {
		const year = Number(yearMatch[1]);
		const start = new Date(Date.UTC(year, 0, 1));
		const end = new Date(Date.UTC(year + 1, 0, 1));
		return { key: periodKey, kind: 'year', start, end, label: String(year) };
	}

	throw new Error('Periodo inválido');
}

export function currentPeriodKey(kind: 'month' | 'year', date = new Date()) {
	const year = date.getUTCFullYear();
	if (kind === 'year') return String(year);
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

export function shiftPeriodKey(periodKey: string, kind: 'month' | 'year', delta: number) {
	if (kind === 'year') return String(Number(periodKey) + delta);
	const [y, m] = periodKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1 + delta, 1));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

interface MemberCount {
	userId: number;
	name: string;
	total: number;
}

interface SelectBreakdown {
	fieldKey: string;
	fieldLabel: string;
	counts: { option: string; count: number }[];
}

export interface CategoryStats {
	id: number;
	name: string;
	icon: string | null;
	kind: 'counter' | 'detailed';
	ownerType: 'user' | 'group';
	visibility: 'individual' | 'shared';
	total: number;
	byMember?: MemberCount[];
	bySelectField?: SelectBreakdown[];
	trophy?: { winnerUserId: number | null; winnerName: string | null; value: number; closed: boolean };
}

function buildSelectBreakdown(fields: CategoryField[], rows: { dataJson: unknown }[]): SelectBreakdown[] {
	const selectFields = fields.filter((f) => f.type === 'select');
	return selectFields.map((field) => {
		const counts = new Map<string, number>();
		for (const opt of field.options ?? []) counts.set(opt, 0);
		for (const row of rows) {
			const data = row.dataJson as Record<string, unknown>;
			const value = data?.[field.key];
			if (typeof value === 'string' && counts.has(value)) {
				counts.set(value, (counts.get(value) ?? 0) + 1);
			}
		}
		return { fieldKey: field.key, fieldLabel: field.label, counts: [...counts.entries()].map(([option, count]) => ({ option, count })) };
	});
}

async function closeTrophyIfNeeded(categoryId: number, period: Period, byMember: MemberCount[]) {
	if (period.end.getTime() > Date.now()) return undefined; // periodo aún en curso, no se cierra

	const existing = await db.select().from(trophies).where(and(eq(trophies.categoryId, categoryId), eq(trophies.period, period.key))).get();
	if (existing) {
		const winner = byMember.find((m) => m.userId === existing.winnerUserId);
		return { winnerUserId: existing.winnerUserId, winnerName: winner?.name ?? null, value: existing.value, closed: true };
	}

	const sorted = [...byMember].sort((a, b) => b.total - a.total);
	const top = sorted[0];
	const isTie = sorted.length > 1 && sorted[1]?.total === top?.total;
	if (!top || top.total === 0) return { winnerUserId: null, winnerName: null, value: 0, closed: true };

	const winnerUserId = isTie ? null : top.userId;
	await db.insert(trophies).values({ categoryId, period: period.key, winnerUserId, value: top.total, createdAt: new Date() });
	return { winnerUserId, winnerName: isTie ? null : top.name, value: top.total, closed: true };
}

export async function getStatsForPeriod(userId: number, period: Period): Promise<CategoryStats[]> {
	const accessible = await listAccessibleCategories(userId);
	const results: CategoryStats[] = [];

	for (const category of accessible) {
		const rows = await db
			.select({ id: entries.id, userId: entries.userId, dataJson: entries.dataJson })
			.from(entries)
			.where(and(eq(entries.categoryId, category.id), gte(entries.occurredAt, period.start), lt(entries.occurredAt, period.end)));

		const fields = category.kind === 'detailed' ? (category.schemaJson as unknown as CategoryField[]) : [];
		const base: CategoryStats = {
			id: category.id,
			name: category.name,
			icon: category.icon,
			kind: category.kind,
			ownerType: category.ownerType,
			visibility: category.visibility,
			total: rows.length,
		};

		if (category.kind === 'detailed' && fields.some((f) => f.type === 'select')) {
			base.bySelectField = buildSelectBreakdown(fields, rows);
		}

		if (category.ownerType === 'group' && category.visibility === 'individual') {
			const members = await db
				.select({ id: users.id, name: users.name })
				.from(groupMembers)
				.innerJoin(users, eq(users.id, groupMembers.userId))
				.where(eq(groupMembers.groupId, category.ownerId));

			const byMember: MemberCount[] = members.map((m) => ({
				userId: m.id,
				name: m.name,
				total: rows.filter((r) => r.userId === m.id).length,
			}));
			base.byMember = byMember;
			base.trophy = await closeTrophyIfNeeded(category.id, period, byMember);
		}

		results.push(base);
	}

	return results;
}
