import { useState } from 'react';
import { toast } from 'sonner';
import type { CategoryField } from '../lib/categoryField';

function todayLocal() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function EntryForm({ categoryId, fields }: { categoryId: number; fields: CategoryField[] }) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [occurredAt, setOccurredAt] = useState(todayLocal());
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const visibleFields = fields.filter((f) => f.type !== 'photo');

	function setValue(key: string, value: string) {
		setValues((v) => ({ ...v, [key]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const data: Record<string, string | number> = {};
		for (const field of visibleFields) {
			const raw = values[field.key];
			if (raw === undefined || raw === '') continue;
			data[field.key] = field.type === 'number' ? Number(raw) : raw;
		}

		try {
			const res = await fetch('/api/entries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ categoryId, data, occurredAt: `${occurredAt}T12:00:00` }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				setError(body.error ?? 'Algo ha ido mal.');
				setLoading(false);
				return;
			}

			toast.success('Registrado');
			setValues({});
			setOccurredAt(todayLocal());
			setLoading(false);
			window.dispatchEvent(new CustomEvent('recapp:entry-created'));
		} catch {
			setError('No se ha podido conectar. Inténtalo de nuevo.');
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
			{visibleFields.map((field) => (
				<label key={field.key} className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
					{field.label}
					{field.required && <span className="text-red-500"> *</span>}
					{field.type === 'select' ? (
						<select
							value={values[field.key] ?? ''}
							onChange={(e) => setValue(field.key, e.target.value)}
							className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
						>
							<option value="">Selecciona...</option>
							{field.options?.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					) : field.type === 'text_long' ? (
						<textarea
							value={values[field.key] ?? ''}
							onChange={(e) => setValue(field.key, e.target.value)}
							rows={3}
							className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
						/>
					) : (
						<input
							type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
							value={values[field.key] ?? ''}
							onChange={(e) => setValue(field.key, e.target.value)}
							className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
						/>
					)}
				</label>
			))}

			<label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
				Fecha
				<input
					type="date"
					value={occurredAt}
					max={todayLocal()}
					onChange={(e) => setOccurredAt(e.target.value)}
					className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
				/>
			</label>

			{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

			<button
				type="submit"
				disabled={loading}
				className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
			>
				{loading ? 'Guardando…' : 'Registrar'}
			</button>
		</form>
	);
}
