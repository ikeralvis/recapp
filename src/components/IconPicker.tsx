import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CATEGORY_ICON_KEYS, DEFAULT_CATEGORY_ICON, isCategoryIconKey } from '../lib/categoryIcons';
import { REACT_ICONS as ICONS } from '../lib/categoryIconsReact';

export default function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
	const [open, setOpen] = useState(false);
	const selectedKey = isCategoryIconKey(value) ? value : DEFAULT_CATEGORY_ICON;
	const SelectedIcon = ICONS[selectedKey];

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 rounded-2xl border-2 border-sky-100 bg-white px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-blue-500"
			>
				<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
					<SelectedIcon size={18} />
				</span>
				Icono
				<ChevronDown size={16} className={`ml-auto text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
			</button>

			{open && (
				<div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-2xl bg-sky-50 p-3">
					{CATEGORY_ICON_KEYS.map((key) => {
						const IconComp = ICONS[key];
						const active = key === selectedKey;
						return (
							<button
								key={key}
								type="button"
								onClick={() => {
									onChange(key);
									setOpen(false);
								}}
								aria-label={key}
								className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
									active ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-blue-50'
								}`}
							>
								<IconComp size={18} />
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
