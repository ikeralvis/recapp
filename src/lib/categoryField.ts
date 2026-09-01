export const FIELD_TYPES = ['text', 'text_long', 'number', 'select', 'photo', 'date'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface CategoryField {
	key: string;
	label: string;
	type: FieldType;
	options?: string[];
	required: boolean;
}

export function validateFields(fields: unknown): fields is CategoryField[] {
	if (!Array.isArray(fields)) return false;
	const keys = new Set<string>();
	for (const field of fields) {
		if (typeof field !== 'object' || field === null) return false;
		const f = field as Record<string, unknown>;
		if (typeof f.key !== 'string' || !f.key.trim()) return false;
		if (typeof f.label !== 'string' || !f.label.trim()) return false;
		if (typeof f.type !== 'string' || !FIELD_TYPES.includes(f.type as FieldType)) return false;
		if (typeof f.required !== 'boolean') return false;
		if (f.type === 'select') {
			if (!Array.isArray(f.options) || f.options.length === 0 || !f.options.every((o) => typeof o === 'string' && o.trim())) {
				return false;
			}
		}
		if (keys.has(f.key)) return false;
		keys.add(f.key);
	}
	return true;
}
