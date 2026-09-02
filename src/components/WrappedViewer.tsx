import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Star } from 'lucide-react';
import { REACT_ICONS } from '../lib/categoryIconsReact';
import { DEFAULT_CATEGORY_ICON, isCategoryIconKey } from '../lib/categoryIcons';
import type { WrappedData } from '../lib/wrapped';

const GRADIENTS = [
	'from-blue-600 via-indigo-600 to-violet-600',
	'from-violet-600 via-fuchsia-600 to-pink-600',
	'from-amber-500 via-orange-500 to-rose-500',
	'from-emerald-500 via-teal-500 to-cyan-600',
	'from-rose-500 via-pink-500 to-fuchsia-600',
	'from-indigo-600 via-blue-600 to-sky-500',
];

function CountUp({ target, durationMs = 900 }: { target: number; durationMs?: number }) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		let raf: number;
		const start = performance.now();
		function tick(now: number) {
			const progress = Math.min(1, (now - start) / durationMs);
			setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
			if (progress < 1) raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, durationMs]);

	return <>{value}</>;
}

interface Slide {
	key: string;
	render: (gradient: string) => React.ReactNode;
}

function buildSlides(data: WrappedData): Slide[] {
	const slides: Slide[] = [];

	slides.push({
		key: 'intro',
		render: () => (
			<div className="flex flex-col items-center justify-center gap-3 text-center">
				<Sparkles size={32} className="text-white/80" />
				<p className="text-lg font-medium text-white/80">Tu {data.year}</p>
				<p className="font-display text-6xl font-extrabold text-white">
					<CountUp target={data.totalEntries} />
				</p>
				<p className="text-lg font-semibold text-white/90">momentos registrados</p>
			</div>
		),
	});

	if (data.topCategory) {
		const topCategory = data.topCategory;
		const iconKey = isCategoryIconKey(topCategory.icon ?? '') ? topCategory.icon! : DEFAULT_CATEGORY_ICON;
		const Icon = REACT_ICONS[iconKey as keyof typeof REACT_ICONS];
		slides.push({
			key: 'top-category',
			render: () => (
				<div className="flex flex-col items-center justify-center gap-3 text-center">
					<span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white">
						<Icon size={30} />
					</span>
					<p className="text-lg font-medium text-white/80">Tu categoría más usada fue</p>
					<p className="font-display text-4xl font-extrabold text-white">{topCategory.name}</p>
					<p className="text-lg font-semibold text-white/90">
						<CountUp target={topCategory.total} /> veces
					</p>
				</div>
			),
		});
	}

	for (const comparison of data.groupComparisons.slice(0, 3)) {
		const sorted = [...(comparison.byMember ?? [])].sort((a, b) => b.total - a.total);
		slides.push({
			key: `comparison-${comparison.id}`,
			render: () => (
				<div className="flex w-full flex-col items-center justify-center gap-5 text-center">
					<p className="text-lg font-medium text-white/80">{comparison.name}</p>
					<div className="flex w-full max-w-xs flex-col gap-3">
						{sorted.map((m, i) => (
							<div key={m.userId} className="flex items-center gap-3">
								<span className="w-24 shrink-0 truncate text-left text-sm font-semibold text-white/90">{m.name}</span>
								<div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
									<div
										className="h-full rounded-full bg-white"
										style={{ width: `${sorted[0].total ? (m.total / sorted[0].total) * 100 : 0}%` }}
									/>
								</div>
								<span className="w-6 shrink-0 text-sm font-bold text-white">{m.total}</span>
								{i === 0 && m.total > 0 && <Trophy size={16} className="shrink-0 text-amber-300" />}
							</div>
						))}
					</div>
				</div>
			),
		});
	}

	for (const fav of data.favoriteOptions) {
		slides.push({
			key: `favorite-${fav.categoryName}-${fav.fieldLabel}`,
			render: () => (
				<div className="flex flex-col items-center justify-center gap-3 text-center">
					<Star size={28} className="text-white/80" />
					<p className="text-lg font-medium text-white/80">
						{fav.categoryName} · {fav.fieldLabel} favorito
					</p>
					<p className="font-display text-4xl font-extrabold text-white">{fav.option}</p>
					<p className="text-lg font-semibold text-white/90">
						<CountUp target={fav.count} /> veces
					</p>
				</div>
			),
		});
	}

	if (data.trophiesWon > 0) {
		slides.push({
			key: 'trophies',
			render: () => (
				<div className="flex flex-col items-center justify-center gap-3 text-center">
					<Trophy size={32} className="text-amber-300" />
					<p className="font-display text-5xl font-extrabold text-white">
						<CountUp target={data.trophiesWon} />
					</p>
					<p className="text-lg font-semibold text-white/90">{data.trophiesWon === 1 ? 'copa ganada' : 'copas ganadas'} este año</p>
				</div>
			),
		});
	}

	slides.push({
		key: 'closing',
		render: () => (
			<div className="flex flex-col items-center justify-center gap-3 text-center">
				<Sparkles size={32} className="text-white/80" />
				<p className="font-display text-3xl font-extrabold text-white">¡Gracias por usar RecApp!</p>
				<p className="text-lg font-medium text-white/80">Nos vemos el año que viene</p>
			</div>
		),
	});

	return slides;
}

export default function WrappedViewer({ data, closeHref }: { data: WrappedData; closeHref: string }) {
	const slides = useMemo(() => buildSlides(data), [data]);
	const [index, setIndex] = useState(0);

	function next() {
		if (index < slides.length - 1) setIndex((i) => i + 1);
		else window.location.href = closeHref;
	}
	function prev() {
		if (index > 0) setIndex((i) => i - 1);
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'ArrowRight') next();
			if (e.key === 'ArrowLeft') prev();
			if (e.key === 'Escape') window.location.href = closeHref;
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const gradient = GRADIENTS[index % GRADIENTS.length];

	return (
		<div className={`fixed inset-0 z-40 flex flex-col bg-linear-to-br ${gradient} transition-colors duration-500`}>
			<div className="flex gap-1.5 px-4 pt-4">
				{slides.map((s, i) => (
					<div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
						<div className={`h-full rounded-full bg-white transition-all ${i <= index ? 'w-full' : 'w-0'}`} />
					</div>
				))}
			</div>

			<a href={closeHref} className="absolute right-4 top-8 rounded-full bg-white/15 p-2 text-white" aria-label="Cerrar">
				<X size={18} />
			</a>

			<div className="relative flex flex-1 items-center justify-center px-8">
				<button type="button" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Anterior" />
				<button type="button" onClick={next} className="absolute inset-y-0 right-0 w-2/3" aria-label="Siguiente" />

				<AnimatePresence mode="wait">
					<motion.div
						key={slides[index].key}
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -16 }}
						transition={{ duration: 0.35, ease: 'easeOut' }}
						className="pointer-events-none w-full"
					>
						{slides[index].render(gradient)}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
