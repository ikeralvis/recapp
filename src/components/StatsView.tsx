import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, Sparkles } from 'lucide-react';
import { getCached, setCached } from '../lib/apiCache';

const CACHE_TTL_MS = 60_000;

type PeriodKind = 'month' | 'year';

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

interface CategoryStats {
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

function currentPeriodKey(kind: PeriodKind) {
	const now = new Date();
	if (kind === 'year') return String(now.getFullYear());
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftPeriodKey(periodKey: string, kind: PeriodKind, delta: number) {
	if (kind === 'year') return String(Number(periodKey) + delta);
	const [y, m] = periodKey.split('-').map(Number);
	const date = new Date(y, m - 1 + delta, 1);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function StatsView({ currentUserId }: { currentUserId: number }) {
	const [kind, setKind] = useState<PeriodKind>('month');
	const [periodKey, setPeriodKey] = useState(() => currentPeriodKey('month'));
	const [label, setLabel] = useState('');
	const [categories, setCategories] = useState<CategoryStats[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const cacheKey = `recapp_stats_${periodKey}`;
		const cached = getCached<{ label: string; categories: CategoryStats[] }>(cacheKey, CACHE_TTL_MS);
		if (cached) {
			setLabel(cached.label);
			setCategories(cached.categories);
			setLoading(false);
		} else {
			setLoading(true);
		}

		fetch(`/api/stats?period=${periodKey}`)
			.then((r) => r.json())
			.then((body) => {
				setLabel(body.period?.label ?? '');
				setCategories(body.categories ?? []);
				setCached(cacheKey, { label: body.period?.label ?? '', categories: body.categories ?? [] });
			})
			.finally(() => setLoading(false));
	}, [periodKey]);

	function switchKind(nextKind: PeriodKind) {
		setKind(nextKind);
		setPeriodKey(currentPeriodKey(nextKind));
	}

	const groupCategories = categories.filter((c) => c.ownerType === 'group');
	const personalCategories = categories.filter((c) => c.ownerType === 'user');

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm ring-1 ring-sky-100">
				<button
					type="button"
					onClick={() => setPeriodKey((p) => shiftPeriodKey(p, kind, -1))}
					className="rounded-xl p-2 text-slate-400 hover:bg-sky-50"
					aria-label="Periodo anterior"
				>
					<ChevronLeft size={18} />
				</button>
				<div className="flex flex-col items-center">
					<p className="text-sm font-bold capitalize text-slate-800">{label}</p>
					<div className="mt-1 flex gap-1 rounded-full bg-sky-50 p-0.5 text-xs font-semibold">
						<button
							type="button"
							onClick={() => switchKind('month')}
							className={`rounded-full px-2.5 py-1 ${kind === 'month' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
						>
							Mes
						</button>
						<button
							type="button"
							onClick={() => switchKind('year')}
							className={`rounded-full px-2.5 py-1 ${kind === 'year' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
						>
							Año
						</button>
					</div>
				</div>
				<button
					type="button"
					onClick={() => setPeriodKey((p) => shiftPeriodKey(p, kind, 1))}
					className="rounded-xl p-2 text-slate-400 hover:bg-sky-50"
					aria-label="Periodo siguiente"
				>
					<ChevronRight size={18} />
				</button>
			</div>

			{kind === 'year' && !loading && categories.length > 0 && (
				<a
					href={`/app/wrapped/${periodKey}`}
					className="flex items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
				>
					<Sparkles size={18} /> Ver tu {periodKey} Wrapped
				</a>
			)}

			{loading ? (
				<p className="text-center text-sm text-slate-400">Cargando…</p>
			) : categories.length === 0 ? (
				<p className="rounded-3xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-sky-100">
					Todavía no tienes categorías para comparar.
				</p>
			) : (
				<>
					{groupCategories.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
								<Users size={16} className="text-blue-600" /> De grupo
							</p>
							{groupCategories.map((c) => (
								<CategoryCard key={c.id} stats={c} currentUserId={currentUserId} />
							))}
						</div>
					)}

					{personalCategories.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="text-sm font-semibold text-slate-700">Personales</p>
							{personalCategories.map((c) => (
								<CategoryCard key={c.id} stats={c} currentUserId={currentUserId} />
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

function CategoryCard({ stats, currentUserId }: { stats: CategoryStats; currentUserId: number }) {
	const maxMemberTotal = stats.byMember ? Math.max(...stats.byMember.map((m) => m.total), 1) : 1;

	return (
		<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100">
			<div className="mb-2 flex items-center justify-between">
				<p className="font-semibold text-slate-800">{stats.name}</p>
				<p className="font-display text-lg font-extrabold text-blue-600">{stats.total}</p>
			</div>

			{stats.byMember && (
				<div className="flex flex-col gap-1.5">
					{stats.byMember.map((m) => (
						<div key={m.userId} className="flex items-center gap-2">
							<span className={`w-16 shrink-0 truncate text-xs font-medium ${m.userId === currentUserId ? 'text-blue-600' : 'text-slate-500'}`}>
								{m.name}
							</span>
							<div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-50">
								<div
									className="h-full rounded-full bg-blue-500"
									style={{ width: `${(m.total / maxMemberTotal) * 100}%` }}
								/>
							</div>
							<span className="w-5 shrink-0 text-right text-xs font-bold text-slate-700">{m.total}</span>
						</div>
					))}
					{stats.trophy?.closed && stats.trophy.winnerName && (
						<p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
							<Trophy size={13} /> {stats.trophy.winnerName} ganó este periodo
						</p>
					)}
					{!stats.trophy?.closed && stats.byMember.some((m) => m.total > 0) && (
						<p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-500">
							<TrendingUp size={13} /> Periodo en curso
						</p>
					)}
				</div>
			)}

			{stats.bySelectField?.map((field) => (
				<div key={field.fieldKey} className="mt-2 flex flex-wrap gap-1.5">
					{field.counts
						.filter((c) => c.count > 0)
						.map((c) => (
							<span key={c.option} className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-slate-600">
								{c.option}: {c.count}
							</span>
						))}
				</div>
			))}
		</div>
	);
}
