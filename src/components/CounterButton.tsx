import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function CounterButton({ categoryId, initialTotal }: { categoryId: number; initialTotal: number }) {
	const [total, setTotal] = useState(initialTotal);
	const [pulsing, setPulsing] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleTap() {
		if (loading) return;
		setLoading(true);
		setPulsing(true);
		setTimeout(() => setPulsing(false), 220);

		const res = await fetch('/api/entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ categoryId }),
		});

		setLoading(false);

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			toast.error(body.error ?? 'No se ha podido registrar.');
			return;
		}

		setTotal((t) => t + 1);
		toast.success('+1 registrado');
		window.dispatchEvent(new CustomEvent('recapp:entry-created'));
	}

	return (
		<div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-sky-100">
			<p className="text-sm font-medium text-slate-500">Total</p>
			<p className="font-display text-5xl font-extrabold text-slate-900">{total}</p>
			<button
				type="button"
				onClick={handleTap}
				disabled={loading}
				className={`mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 transition disabled:opacity-70 ${
					pulsing ? 'scale-110' : 'scale-100'
				}`}
			>
				<Plus size={28} />
			</button>
		</div>
	);
}
