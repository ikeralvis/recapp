import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import type { CategoryField } from '../lib/categoryField';
import { getCached, setCached } from '../lib/apiCache';
import EntryFieldsInput from './EntryFieldsInput';

const CACHE_TTL_MS = 60_000;

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

function toDateInput(iso: string) {
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
	const cacheKey = `recapp_entries_${categoryId}`;
	const cached = getCached<Entry[]>(cacheKey, CACHE_TTL_MS);
	const [entries, setEntries] = useState<Entry[]>(cached ?? []);
	const [loading, setLoading] = useState(!cached);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editValues, setEditValues] = useState<Record<string, string>>({});
	const [editDate, setEditDate] = useState('');
	const [saving, setSaving] = useState(false);

	async function load() {
		const res = await fetch(`/api/entries?categoryId=${categoryId}`);
		if (res.ok) {
			const data = await res.json();
			setEntries(data);
			setCached(cacheKey, data);
		}
		setLoading(false);
	}

	useEffect(() => {
		load();
		const handler = () => load();
		window.addEventListener('recapp:entry-created', handler);
		return () => window.removeEventListener('recapp:entry-created', handler);
	}, [categoryId]);

	function startEdit(entry: Entry) {
		setEditingId(entry.id);
		setEditDate(toDateInput(entry.occurredAt));
		const values: Record<string, string> = {};
		for (const [key, value] of Object.entries(entry.dataJson ?? {})) values[key] = String(value);
		setEditValues(values);
	}

	function cancelEdit() {
		setEditingId(null);
		setEditValues({});
	}

	async function saveEdit(id: number) {
		setSaving(true);
		const data: Record<string, string | number> = {};
		for (const field of fields) {
			const raw = editValues[field.key];
			if (raw === undefined || raw === '') continue;
			data[field.key] = field.type === 'number' ? Number(raw) : raw;
		}

		const res = await fetch(`/api/entries/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ data, occurredAt: `${editDate}T12:00:00` }),
		});

		setSaving(false);
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			toast.error(body.error ?? 'No se ha podido guardar.');
			return;
		}

		const updated = await res.json();
		setEntries((e) => {
			const next = e.map((entry) => (entry.id === id ? { ...entry, occurredAt: updated.occurredAt, dataJson: updated.dataJson } : entry));
			setCached(cacheKey, next);
			return next;
		});
		setEditingId(null);
		toast.success('Entrada actualizada');
	}

	async function handleDelete(id: number) {
		const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			toast.error('No se ha podido borrar.');
			return;
		}
		setEntries((e) => {
			const next = e.filter((entry) => entry.id !== id);
			setCached(cacheKey, next);
			return next;
		});
		toast.success('Entrada borrada');
	}

	const fieldLabels = Object.fromEntries(fields.map((f) => [f.key, f.label]));

	if (loading) return <p className="text-sm text-slate-400">Cargando historial…</p>;
	if (entries.length === 0) return <p className="text-sm text-slate-500">Todavía no hay entradas registradas.</p>;

	return (
		<ul className="flex flex-col gap-2">
			{entries.map((entry) => {
				const dataEntries = Object.entries(entry.dataJson ?? {}).filter(([, v]) => v !== '' && v !== undefined);

				if (editingId === entry.id) {
					return (
						<li key={entry.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-blue-200">
							<label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
								Fecha
								<input
									type="date"
									value={editDate}
									max={toDateInput(new Date().toISOString())}
									onChange={(e) => setEditDate(e.target.value)}
									className="rounded-lg border-2 border-sky-100 px-2 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
								/>
							</label>
							{fields.length > 0 && (
								<EntryFieldsInput
									fields={fields}
									values={editValues}
									onChange={(key, value) => setEditValues((v) => ({ ...v, [key]: value }))}
								/>
							)}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => saveEdit(entry.id)}
									disabled={saving}
									className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white disabled:opacity-70"
								>
									<Check size={14} /> Guardar
								</button>
								<button
									type="button"
									onClick={cancelEdit}
									className="inline-flex items-center justify-center gap-1 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-slate-500"
								>
									<X size={14} /> Cancelar
								</button>
							</div>
						</li>
					);
				}

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
							<div className="flex shrink-0 gap-0.5">
								<button
									type="button"
									onClick={() => startEdit(entry)}
									className="rounded-lg p-1.5 text-slate-300 hover:bg-blue-50 hover:text-blue-500"
									aria-label="Editar entrada"
								>
									<Pencil size={16} />
								</button>
								<button
									type="button"
									onClick={() => handleDelete(entry.id)}
									className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
									aria-label="Borrar entrada"
								>
									<Trash2 size={16} />
								</button>
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
