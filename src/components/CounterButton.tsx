import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, CalendarDays } from 'lucide-react';

function todayLocal() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function CounterButton({
	categoryId,
	initialToday,
	initialTotal,
}: {
	categoryId: number;
	initialToday: number;
	initialTotal: number;
}) {
	const [today, setToday] = useState(initialToday);
	const [total, setTotal] = useState(initialTotal);
	const [pulsing, setPulsing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showDate, setShowDate] = useState(false);
	const [date, setDate] = useState(todayLocal());

	async function register() {
		if (loading) return;
		setLoading(true);
		setPulsing(true);
		setTimeout(() => setPulsing(false), 220);

		const isToday = date === todayLocal();
		const res = await fetch('/api/entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ categoryId, ...(isToday ? {} : { occurredAt: `${date}T12:00:00` }) }),
		});

		setLoading(false);

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			toast.error(body.error ?? 'No se ha podido registrar.');
			return;
		}

		setTotal((t) => t + 1);
		if (isToday) {
			setToday((t) => t + 1);
			toast.success(`Hoy: ${today + 1}`);
		} else {
			toast.success('Registrado');
			setDate(todayLocal());
		}
		setShowDate(false);
		window.dispatchEvent(new CustomEvent('recapp:entry-created'));
	}

	return (
		<div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-sky-100">
			<p className="text-sm font-medium text-slate-500">Hoy</p>
			<p className="font-display text-5xl font-extrabold text-slate-900">{today}</p>
			<button
				type="button"
				onClick={register}
				disabled={loading}
				className={`mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 transition disabled:opacity-70 ${
					pulsing ? 'scale-110' : 'scale-100'
				}`}
			>
				<Plus size={28} />
			</button>
			<p className="mt-1 text-xs font-medium text-slate-400">{total} en total</p>

			<button
				type="button"
				onClick={() => setShowDate((s) => !s)}
				className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-600"
			>
				<CalendarDays size={13} /> Registrar en otra fecha
			</button>
			{showDate && (
				<input
					type="date"
					value={date}
					max={todayLocal()}
					onChange={(e) => setDate(e.target.value)}
					className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
				/>
			)}
		</div>
	);
}
