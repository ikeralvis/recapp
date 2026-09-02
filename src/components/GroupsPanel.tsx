import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Plus, Link2, Copy } from 'lucide-react';
import { getCachedGroups, setCachedGroups } from '../lib/groupsCache';

interface Member {
	id: number;
	name: string;
}

interface Group {
	id: number;
	name: string;
	members: Member[];
}

export default function GroupsPanel() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [inviteLinks, setInviteLinks] = useState<Record<number, string>>({});
	const [generatingFor, setGeneratingFor] = useState<number | null>(null);

	useEffect(() => {
		const cached = getCachedGroups<Group[]>();
		if (cached) {
			setGroups(cached);
			setLoading(false);
		}

		fetch('/api/groups')
			.then((r) => r.json())
			.then((data: Group[]) => {
				setGroups(data);
				setCachedGroups(data);
			})
			.finally(() => setLoading(false));
	}, []);

	async function createGroup(e: React.FormEvent) {
		e.preventDefault();
		if (!newGroupName.trim()) return;
		setCreating(true);

		const res = await fetch('/api/groups', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newGroupName.trim() }),
		});

		const body = await res.json().catch(() => ({}));
		setCreating(false);

		if (!res.ok) {
			toast.error(body.error ?? 'No se ha podido crear el grupo.');
			return;
		}

		setGroups((g) => {
			const next = [...g, body];
			setCachedGroups(next);
			return next;
		});
		setNewGroupName('');
		setShowCreate(false);
		toast.success('Grupo creado');
	}

	async function generateInvite(groupId: number) {
		setGeneratingFor(groupId);
		const res = await fetch(`/api/groups/${groupId}/invites`, { method: 'POST' });
		const body = await res.json().catch(() => ({}));
		setGeneratingFor(null);

		if (!res.ok) {
			toast.error(body.error ?? 'No se ha podido generar el link.');
			return;
		}

		const link = `${window.location.origin}/app/invite/${body.token}`;
		setInviteLinks((links) => ({ ...links, [groupId]: link }));
	}

	async function copyLink(link: string) {
		try {
			await navigator.clipboard.writeText(link);
			toast.success('Link copiado');
		} catch {
			toast.error('No se ha podido copiar. Cópialo manualmente.');
		}
	}

	return (
		<div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
			<div className="flex items-center justify-between">
				<p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
					<Users size={18} className="text-blue-600" /> Mi grupo
				</p>
				<button
					type="button"
					onClick={() => setShowCreate((s) => !s)}
					className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600"
				>
					<Plus size={14} /> Crear grupo
				</button>
			</div>

			{showCreate && (
				<form onSubmit={createGroup} className="flex gap-2">
					<input
						value={newGroupName}
						onChange={(e) => setNewGroupName(e.target.value)}
						placeholder="Ej. Yo y Marta"
						className="flex-1 rounded-xl border-2 border-sky-100 px-3 py-2 text-sm outline-none focus:border-blue-500"
					/>
					<button
						type="submit"
						disabled={creating}
						className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
					>
						{creating ? 'Creando…' : 'Crear'}
					</button>
				</form>
			)}

			{loading ? (
				<p className="text-sm text-slate-400">Cargando…</p>
			) : groups.length === 0 ? (
				<p className="text-sm text-slate-500">
					Todavía no tienes ningún grupo. Créalo para poder compartir categorías y comparar estadísticas.
				</p>
			) : (
				<ul className="flex flex-col gap-3">
					{groups.map((group) => (
						<li key={group.id} className="rounded-2xl bg-sky-50 p-3">
							<p className="font-semibold text-slate-800">{group.name}</p>
							<p className="text-xs text-slate-500">{group.members.map((m) => m.name).join(', ')}</p>

							{inviteLinks[group.id] ? (
								<div className="mt-2 flex gap-2">
									<input
										readOnly
										value={inviteLinks[group.id]}
										className="flex-1 truncate rounded-lg border border-sky-200 bg-white px-2 py-1.5 text-xs text-slate-600"
									/>
									<button
										type="button"
										onClick={() => copyLink(inviteLinks[group.id])}
										className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
									>
										<Copy size={13} /> Copiar
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => generateInvite(group.id)}
									disabled={generatingFor === group.id}
									className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 disabled:opacity-70"
								>
									<Link2 size={13} /> {generatingFor === group.id ? 'Generando…' : 'Invitar'}
								</button>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
