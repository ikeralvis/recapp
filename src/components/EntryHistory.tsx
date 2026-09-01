import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { CategoryField } from '../lib/categoryField';

interface Entry {
	id: number;
	occurredAt: string;
	dataJson: Record<string, string | number>;
	userId: number;
	userName: string;
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function EntryHistory({
	categoryId,
	fields,
	showAuthor,
	currentUserId,
}: {
	categoryId: number;
	fields: CategoryField[];
	showAuthor: boolean;
	currentUserId: number;
}) {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [loading, setLoading] = useState(true);

	async function load() {
		const res = await fetch(`/api/entries?categoryId=${categoryId}`);
		if (res.ok) setEntries(await res.json());
		setLoading(false);
	}

	useEffect(() => {
		load();
		const handler = () => load();
		window.addEventListener('recapp:entry-created', handler);
		return () => window.removeEventListener('recapp:entry-created', handler);
	}, [categoryId]);

	async function handleDelete(id: number) {
		const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			toast.error('No se ha podido borrar.');
			return;
		}
		setEntries((e) => e.filter((entry) => entry.id !== id));
		toast.success('Entrada borrada');
	}

	const fieldLabels = Object.fromEntries(fields.map((f) => [f.key, f.label]));

	if (loading) return <p className="text-sm text-slate-400">Cargando historial…</p>;
	if (entries.length === 0) return <p className="text-sm text-slate-500">Todavía no hay entradas registradas.</p>;

	return (
		<ul className="flex flex-col gap-2">
			{entries.map((entry) => {
				const dataEntries = Object.entries(entry.dataJson ?? {}).filter(([, v]) => v !== '' && v !== undefined);
				return (
					<li key={entry.id} className="flex items-start justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sky-100">
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium text-slate-400">
								{formatDate(entry.occurredAt)}
								{showAuthor && ` · ${entry.userName}`}
							</p>
							{dataEntries.length > 0 && (
								<dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-700">
									{dataEntries.map(([key, value]) => (
										<div key={key} className="flex gap-1">
											<dt className="font-semibold">{fieldLabels[key] ?? key}:</dt>
											<dd>{String(value)}</dd>
										</div>
									))}
								</dl>
							)}
						</div>
						{entry.userId === currentUserId && (
							<button
								type="button"
								onClick={() => handleDelete(entry.id)}
								className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
								aria-label="Borrar entrada"
							>
								<Trash2 size={16} />
							</button>
						)}
					</li>
				);
			})}
		</ul>
	);
}
