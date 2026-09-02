import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { REACT_ICONS } from '../lib/categoryIconsReact';
import { DEFAULT_CATEGORY_ICON, isCategoryIconKey, type CategoryIconKey } from '../lib/categoryIcons';
import EntryForm from './EntryForm';
import type { CategoryField } from '../lib/categoryField';

interface QuickCategory {
	id: number;
	name: string;
	icon: string | null;
	fields: CategoryField[];
}

export default function QuickAddModal({ categories }: { categories: QuickCategory[] }) {
	const [openId, setOpenId] = useState<number | null>(null);

	useEffect(() => {
		function handleOpen(e: Event) {
			const id = (e as CustomEvent<{ categoryId: number }>).detail?.categoryId;
			if (id) setOpenId(id);
		}
		function handleCreated() {
			setTimeout(() => setOpenId(null), 600);
		}
		window.addEventListener('recapp:open-quick-add', handleOpen);
		window.addEventListener('recapp:entry-created', handleCreated);
		return () => {
			window.removeEventListener('recapp:open-quick-add', handleOpen);
			window.removeEventListener('recapp:entry-created', handleCreated);
		};
	}, []);

	const category = categories.find((c) => c.id === openId);
	if (!category) return null;

	const rawIcon = category.icon ?? '';
	const iconKey: CategoryIconKey = isCategoryIconKey(rawIcon) ? rawIcon : DEFAULT_CATEGORY_ICON;
	const Icon = REACT_ICONS[iconKey];

	return (
		<div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpenId(null)}>
			<div
				className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-sky-50 p-5 pb-8"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
							<Icon size={18} />
						</span>
						<h2 className="font-display text-lg font-bold text-slate-900">{category.name}</h2>
					</div>
					<button
						type="button"
						onClick={() => setOpenId(null)}
						className="rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-slate-600"
						aria-label="Cerrar"
					>
						<X size={16} />
					</button>
				</div>

				<EntryForm categoryId={category.id} fields={category.fields} />
			</div>
		</div>
	);
}
