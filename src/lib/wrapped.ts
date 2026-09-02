import { and, eq, like } from 'drizzle-orm';
import { db } from '../db/client';
import { trophies } from '../db/schema';
import { getStatsForPeriod, parsePeriod, type CategoryStats } from './stats';

export interface WrappedData {
	year: string;
	totalEntries: number;
	categoriesUsed: number;
	topCategory: { name: string; icon: string | null; total: number } | null;
	groupComparisons: CategoryStats[];
	favoriteOptions: { categoryName: string; fieldLabel: string; option: string; count: number }[];
	trophiesWon: number;
}

export async function getWrappedData(userId: number, year: string): Promise<WrappedData> {
	const period = parsePeriod(year);
	const stats = await getStatsForPeriod(userId, period);

	const withEntries = stats.filter((s) => s.total > 0);
	const totalEntries = withEntries.reduce((sum, s) => sum + s.total, 0);

	const topCategory = [...withEntries].sort((a, b) => b.total - a.total)[0] ?? null;

	const groupComparisons = stats.filter((s) => s.ownerType === 'group' && s.byMember && s.byMember.some((m) => m.total > 0));

	const favoriteOptions: WrappedData['favoriteOptions'] = [];
	for (const cat of withEntries) {
		if (!cat.bySelectField) continue;
		for (const field of cat.bySelectField) {
			const top = [...field.counts].sort((a, b) => b.count - a.count)[0];
			if (top && top.count > 0) {
				favoriteOptions.push({ categoryName: cat.name, fieldLabel: field.fieldLabel, option: top.option, count: top.count });
			}
		}
	}

	const trophyRows = await db
		.select()
		.from(trophies)
		.where(and(eq(trophies.winnerUserId, userId), like(trophies.period, `${year}%`)));

	return {
		year,
		totalEntries,
		categoriesUsed: withEntries.length,
		topCategory: topCategory ? { name: topCategory.name, icon: topCategory.icon, total: topCategory.total } : null,
		groupComparisons,
		favoriteOptions: favoriteOptions.slice(0, 4),
		trophiesWon: trophyRows.length,
	};
}
