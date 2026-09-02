import { useState } from 'react';
import { toast } from 'sonner';
import { Shuffle, Palette } from 'lucide-react';
import { AVATAR_COLORS, type AvatarColor } from '../lib/avatarColors';
import { DICEBEAR_STYLES, buildAvatarUrl, randomSeed, type DicebearStyle } from '../lib/avatar';

type Mode = 'color' | 'illustrated';

interface Props {
	initialName: string;
	initialColor: AvatarColor;
	initialStyle: DicebearStyle | null;
	initialSeed: string;
	initialAccent: AvatarColor;
}

export default function ProfileForm({ initialName, initialColor, initialStyle, initialSeed, initialAccent }: Props) {
	const [name, setName] = useState(initialName);
	const [mode, setMode] = useState<Mode>(initialStyle ? 'illustrated' : 'color');
	const [color, setColor] = useState<AvatarColor>(initialColor);
	const [style, setStyle] = useState<DicebearStyle>(initialStyle ?? 'avataaars');
	const [seed, setSeed] = useState(initialSeed || randomSeed());
	const [accent, setAccent] = useState<AvatarColor>(initialAccent);
	const [loading, setLoading] = useState(false);

	function previewAccent(key: AvatarColor) {
		setAccent(key);
		document.documentElement.dataset.accent = key;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) {
			toast.error('El nombre es obligatorio.');
			return;
		}
		setLoading(true);

		const res = await fetch('/api/profile', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: name.trim(),
				avatarColor: color,
				avatarStyle: mode === 'illustrated' ? style : null,
				avatarSeed: seed,
				accentColor: accent,
			}),
		});

		setLoading(false);
		const body = await res.json().catch(() => ({}));
		if (res.ok) {
			toast.success('Perfil actualizado');
		} else {
			toast.error(body.error ?? 'Algo ha ido mal.');
		}
	}

	const initial = name.trim()[0]?.toUpperCase() ?? '?';

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col items-center gap-2 pb-2">
				{mode === 'illustrated' ? (
					<img
						src={buildAvatarUrl(style, seed)}
						alt="Tu avatar"
						className="h-20 w-20 rounded-full bg-sky-100 shadow-lg"
					/>
				) : (
					<div
						className={`flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br font-display text-3xl font-extrabold text-white shadow-lg ${AVATAR_COLORS[color]}`}
					>
						{initial}
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
				<label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
					Nombre
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						className="rounded-2xl border-2 border-sky-100 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-500"
					/>
				</label>

				<div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
					Avatar
					<div className="flex gap-1 self-start rounded-full bg-sky-50 p-0.5 text-xs font-semibold">
						<button
							type="button"
							onClick={() => setMode('color')}
							className={`rounded-full px-3 py-1.5 ${mode === 'color' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
						>
							Iniciales
						</button>
						<button
							type="button"
							onClick={() => setMode('illustrated')}
							className={`rounded-full px-3 py-1.5 ${mode === 'illustrated' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
						>
							Ilustrado
						</button>
					</div>

					{mode === 'color' ? (
						<div className="flex gap-2">
							{Object.entries(AVATAR_COLORS).map(([key, gradient]) => (
								<button
									key={key}
									type="button"
									aria-label={key}
									onClick={() => setColor(key as AvatarColor)}
									className={`h-9 w-9 rounded-full bg-linear-to-br transition ${gradient} ${
										color === key ? 'ring-2 ring-offset-2 ring-blue-500' : ''
									}`}
								/>
							))}
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap gap-2">
								{DICEBEAR_STYLES.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => setStyle(s)}
										aria-label={s}
										className={`h-12 w-12 overflow-hidden rounded-full bg-sky-50 transition ${
											style === s ? 'ring-2 ring-offset-2 ring-blue-500' : ''
										}`}
									>
										<img src={buildAvatarUrl(s, seed)} alt={s} className="h-full w-full" />
									</button>
								))}
							</div>
							<button
								type="button"
								onClick={() => setSeed(randomSeed())}
								className="inline-flex items-center gap-1 self-start text-xs font-semibold text-blue-600 hover:underline"
							>
								<Shuffle size={13} /> Probar otro
							</button>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
					<span className="inline-flex items-center gap-1.5">
						<Palette size={15} className="text-blue-600" /> Tema de la app
					</span>
					<div className="flex gap-2">
						{Object.keys(AVATAR_COLORS).map((key) => (
							<button
								key={key}
								type="button"
								aria-label={key}
								onClick={() => previewAccent(key as AvatarColor)}
								className={`h-9 w-9 rounded-full bg-linear-to-br transition ${AVATAR_COLORS[key as AvatarColor]} ${
									accent === key ? 'ring-2 ring-offset-2 ring-blue-500' : ''
								}`}
							/>
						))}
					</div>
					<p className="text-xs font-normal text-slate-400">Cambia el color principal de toda la app.</p>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
				>
					{loading ? 'Guardando…' : 'Guardar cambios'}
				</button>
			</form>
		</div>
	);
}
