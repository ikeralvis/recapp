import type { CategoryField } from '../lib/categoryField';

export default function EntryFieldsInput({
	fields,
	values,
	onChange,
}: {
	fields: CategoryField[];
	values: Record<string, string>;
	onChange: (key: string, value: string) => void;
}) {
	return (
		<>
			{fields.map((field) => (
				<label key={field.key} className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
					{field.label}
					{field.required && <span className="text-red-500"> *</span>}
					{field.type === 'select' ? (
						<select
							value={values[field.key] ?? ''}
							onChange={(e) => onChange(field.key, e.target.value)}
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
							onChange={(e) => onChange(field.key, e.target.value)}
							rows={3}
							className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
						/>
					) : (
						<input
							type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
							value={values[field.key] ?? ''}
							onChange={(e) => onChange(field.key, e.target.value)}
							className="rounded-xl border-2 border-sky-100 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
						/>
					)}
				</label>
			))}
		</>
	);
}
