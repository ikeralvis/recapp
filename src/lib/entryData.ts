import type { CategoryField } from './categoryField';

export function validateEntryData(fields: CategoryField[], data: unknown): string | null {
	if (typeof data !== 'object' || data === null || Array.isArray(data)) {
		return 'Datos de la entrada inválidos.';
	}
	const values = data as Record<string, unknown>;

	for (const field of fields) {
		if (field.type === 'photo') continue; // subida de fotos fuera de alcance del MVP

		const value = values[field.key];
		const isEmpty = value === undefined || value === null || value === '';

		if (field.required && isEmpty) {
			return `El campo "${field.label}" es obligatorio.`;
		}
		if (isEmpty) continue;

		if (field.type === 'number' && typeof value !== 'number' && Number.isNaN(Number(value))) {
			return `El campo "${field.label}" debe ser un número.`;
		}
		if (field.type === 'select' && (typeof value !== 'string' || !field.options?.includes(value))) {
			return `El campo "${field.label}" tiene un valor no válido.`;
		}
		if ((field.type === 'text' || field.type === 'text_long') && typeof value !== 'string') {
			return `El campo "${field.label}" debe ser texto.`;
		}
	}

	return null;
}
