import { useEffect, useState } from 'react';
import { Hash, ClipboardList, X, Plus, User, Users, Columns2, Combine } from 'lucide-react';
import IconPicker from './IconPicker';
import { DEFAULT_CATEGORY_ICON } from '../lib/categoryIcons';
import { setFlashMessage } from '../lib/flash';

type FieldType = 'text' | 'text_long' | 'number' | 'select' | 'photo' | 'date';
type OwnerType = 'user' | 'group';
type Visibility = 'individual' | 'shared';

interface CategoryField {
	key: string;
	label: string;
	type: FieldType;
	options?: string[];
	required: boolean;
}

interface GroupOption {
	id: number;
	name: string;
}

interface CategoryData {
	id?: number;
	name: string;
	icon: string;
	kind: 'counter' | 'detailed';
	ownerType?: OwnerType;
	groupId?: number | null;
	visibility?: Visibility;
	fields: CategoryField[];
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
	text: 'Texto corto',
	text_long: 'Texto largo',
	number: 'Número',
	select: 'Selección (opciones)',
	photo: 'Foto',
	date: 'Fecha',
};

function slugify(label: string) {
	return label
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Mark}/gu, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

export default function CategoryForm({ initial }: { initial?: CategoryData }) {
	const isEdit = !!initial?.id;
	const [name, setName] = useState(initial?.name ?? '');
	const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_CATEGORY_ICON);
	const [kind, setKind] = useState<'counter' | 'detailed'>(initial?.kind ?? 'counter');
	const [fields, setFields] = useState<CategoryField[]>(initial?.fields ?? []);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const [ownerType, setOwnerType] = useState<OwnerType>(initial?.ownerType ?? 'user');
	const [groupId, setGroupId] = useState<number | null>(initial?.groupId ?? null);
	const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'individual');
	const [groups, setGroups] = useState<GroupOption[]>([]);
	const [groupsLoaded, setGroupsLoaded] = useState(false);
	const [showNewGroup, setShowNewGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [creatingGroup, setCreatingGroup] = useState(false);

	useEffect(() => {
		fetch('/api/groups')
			.then((r) => r.json())
			.then((data: GroupOption[]) => {
				setGroups(data);
				setGroupsLoaded(true);
			})
			.catch(() => setGroupsLoaded(true));
	}, []);

	async function createGroupInline() {
		if (!newGroupName.trim()) return;
		setCreatingGroup(true);
		const res = await fetch('/api/groups', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newGroupName.trim() }),
		});
		const body = await res.json().catch(() => ({}));
		setCreatingGroup(false);

		if (!res.ok) {
			setError(body.error ?? 'No se ha podido crear el grupo.');
			return;
		}

		setGroups((g) => [...g, body]);
		setGroupId(body.id);
		setNewGroupName('');
		setShowNewGroup(false);
	}

	function addField() {
		setFields((f) => [...f, { key: '', label: '', type: 'text', required: false }]);
	}

	function updateField(index: number, patch: Partial<CategoryField>) {
		setFields((f) =>
			f.map((field, i) => {
				if (i !== index) return field;
				const next = { ...field, ...patch };
				if (patch.label !== undefined && (!field.key || field.key === slugify(field.label))) {
					next.key = slugify(patch.label);
				}
				return next;
			})
		);
	}

	function removeField(index: number) {
		setFields((f) => f.filter((_, i) => i !== index));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError('Ponle un nombre a la categoría.');
			return;
		}
		if (ownerType === 'group' && !groupId) {
			setError('Elige un grupo o crea uno nuevo.');
			return;
		}
		if (kind === 'detailed') {
			for (const field of fields) {
				if (!field.label.trim() || !field.key.trim()) {
					setError('Todos los campos necesitan una etiqueta.');
					return;
				}
				if (field.type === 'select' && (!field.options || field.options.filter((o) => o.trim()).length === 0)) {
					setError(`El campo "${field.label}" es de selección y necesita al menos una opción.`);
					return;
				}
			}
		}

		setLoading(true);
		const payload = {
			name: name.trim(),
			icon: icon.trim(),
			kind,
			ownerType,
			groupId: ownerType === 'group' ? groupId : undefined,
			visibility: ownerType === 'group' ? visibility : undefined,
			fields: kind === 'detailed' ? fields.map((f) => ({ ...f, options: f.options?.filter((o) => o.trim()) })) : [],
		};

		try {
			const res = await fetch(isEdit ? `/api/categories/${initial!.id}` : '/api/categories', {
				method: isEdit ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				setError(body.error ?? 'Algo ha ido mal.');
				setLoading(false);
				return;
			}

			setFlashMessage(isEdit ? 'Categoría actualizada' : 'Categoría creada');
			window.location.href = '/app/categories';
		} catch {
			setError('No se ha podido conectar. Inténtalo de nuevo.');
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<IconPicker value={icon} onChange={setIcon} />

			<label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
				Nombre
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Restaurantes"
					className="rounded-2xl border-2 border-sky-100 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-500"
				/>
			</label>

			<div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
				¿Dónde vive?
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						disabled={isEdit}
						onClick={() => setOwnerType('user')}
						className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
							ownerType === 'user' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
						}`}
					>
						<span className="inline-flex items-center gap-1.5">
							<User size={16} /> Personal
						</span>
						<p className="mt-0.5 text-xs font-normal text-slate-500">Solo tú la ves</p>
					</button>
					<button
						type="button"
						disabled={isEdit}
						onClick={() => setOwnerType('group')}
						className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
							ownerType === 'group' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
						}`}
					>
						<span className="inline-flex items-center gap-1.5">
							<Users size={16} /> De grupo
						</span>
						<p className="mt-0.5 text-xs font-normal text-slate-500">Se puede comparar</p>
					</button>
				</div>
			</div>

			{ownerType === 'group' && (
				<div className="flex flex-col gap-3 rounded-2xl bg-sky-50 p-4">
					<p className="text-sm font-semibold text-slate-700">Grupo</p>

					{groupsLoaded && groups.length === 0 && !showNewGroup && (
						<p className="text-xs text-slate-500">Todavía no tienes ningún grupo. Crea uno para poder compartir esta categoría.</p>
					)}

					{groups.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{groups.map((g) => (
								<button
									key={g.id}
									type="button"
									disabled={isEdit}
									onClick={() => setGroupId(g.id)}
									className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
										groupId === g.id ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-sky-100 bg-white text-slate-600'
									}`}
								>
									{g.name}
								</button>
							))}
						</div>
					)}

					{!isEdit &&
						(showNewGroup ? (
							<div className="flex gap-2">
								<input
									value={newGroupName}
									onChange={(e) => setNewGroupName(e.target.value)}
									placeholder="Ej. Yo y Marta"
									className="flex-1 rounded-xl border-2 border-sky-100 px-3 py-2 text-sm outline-none focus:border-blue-500"
								/>
								<button
									type="button"
									onClick={createGroupInline}
									disabled={creatingGroup}
									className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
								>
									{creatingGroup ? 'Creando…' : 'Crear'}
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setShowNewGroup(true)}
								className="inline-flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sky-300 py-2 text-sm font-semibold text-blue-600 hover:bg-white"
							>
								<Plus size={16} /> Nuevo grupo
							</button>
						))}
				</div>
			)}

			{ownerType === 'group' && (
				<div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
					Visibilidad
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							disabled={isEdit}
							onClick={() => setVisibility('individual')}
							className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
								visibility === 'individual' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
							}`}
						>
							<span className="inline-flex items-center gap-1.5">
								<Columns2 size={16} /> Individual
							</span>
							<p className="mt-0.5 text-xs font-normal text-slate-500">Cada uno cuenta lo suyo (ej. 3 vs 4)</p>
						</button>
						<button
							type="button"
							disabled={isEdit}
							onClick={() => setVisibility('shared')}
							className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
								visibility === 'shared' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
							}`}
						>
							<span className="inline-flex items-center gap-1.5">
								<Combine size={16} /> Compartida
							</span>
							<p className="mt-0.5 text-xs font-normal text-slate-500">Un único total entre todos</p>
						</button>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
				Tipo
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						disabled={isEdit}
						onClick={() => setKind('counter')}
						className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
							kind === 'counter' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
						}`}
					>
						<span className="inline-flex items-center gap-1.5">
							<Hash size={16} /> Contador
						</span>
						<p className="mt-0.5 text-xs font-normal text-slate-500">Solo sumas +1, sin más datos</p>
					</button>
					<button
						type="button"
						disabled={isEdit}
						onClick={() => setKind('detailed')}
						className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition disabled:opacity-50 ${
							kind === 'detailed' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-sky-100 text-slate-600'
						}`}
					>
						<span className="inline-flex items-center gap-1.5">
							<ClipboardList size={16} /> Detallada
						</span>
						<p className="mt-0.5 text-xs font-normal text-slate-500">Con campos que rellenas cada vez</p>
					</button>
				</div>
			</div>

			{kind === 'detailed' && (
				<div className="flex flex-col gap-3 rounded-2xl bg-sky-50 p-4">
					<p className="text-sm font-semibold text-slate-700">Campos a registrar</p>
					{fields.map((field, i) => (
						<div key={i} className="flex min-w-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
							<input
								value={field.label}
								onChange={(e) => updateField(i, { label: e.target.value })}
								placeholder="Etiqueta (ej. Tipo de cocina)"
								className="w-full min-w-0 rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-blue-500"
							/>
							<div className="flex min-w-0 gap-2">
								<select
									value={field.type}
									onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
									className="w-0 min-w-0 flex-1 rounded-lg border border-sky-100 px-2 py-2 text-sm outline-none focus:border-blue-500"
								>
									{Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
								<button
									type="button"
									onClick={() => removeField(i)}
									className="shrink-0 rounded-lg px-2 text-red-500 hover:bg-red-50"
									aria-label="Eliminar campo"
								>
									<X size={16} />
								</button>
							</div>

							{field.type === 'select' && (
								<input
									value={(field.options ?? []).join(', ')}
									onChange={(e) => updateField(i, { options: e.target.value.split(',').map((o) => o.trimStart()) })}
									placeholder="Opciones separadas por coma: Mexicano, Italiano, Japonés"
									className="rounded-lg border border-sky-100 px-3 py-2 text-sm outline-none focus:border-blue-500"
								/>
							)}

							<label className="flex items-center gap-2 text-xs font-medium text-slate-500">
								<input
									type="checkbox"
									checked={field.required}
									onChange={(e) => updateField(i, { required: e.target.checked })}
									className="h-4 w-4 accent-blue-600"
								/>
								Obligatorio
							</label>
						</div>
					))}
					<button
						type="button"
						onClick={addField}
						className="inline-flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sky-300 py-2 text-sm font-semibold text-blue-600 hover:bg-white"
					>
						<Plus size={16} /> Añadir campo
					</button>
				</div>
			)}

			{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

			<button
				type="submit"
				disabled={loading}
				className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
			>
				{loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
			</button>
		</form>
	);
}
