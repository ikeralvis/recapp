export const AVATAR_COLORS = {
	blue: 'from-blue-500 to-cyan-400',
	violet: 'from-violet-500 to-fuchsia-400',
	amber: 'from-amber-500 to-orange-400',
	emerald: 'from-emerald-500 to-teal-400',
	rose: 'from-rose-500 to-pink-400',
	indigo: 'from-indigo-500 to-sky-400',
} as const;

export type AvatarColor = keyof typeof AVATAR_COLORS;
export const DEFAULT_AVATAR_COLOR: AvatarColor = 'blue';

export function isAvatarColor(value: string): value is AvatarColor {
	return value in AVATAR_COLORS;
}

/** Hex del tono 600 de cada color, para <meta name="theme-color"> (la barra del navegador en móvil). */
export const ACCENT_HEX: Record<AvatarColor, string> = {
	blue: '#2563eb',
	violet: '#7c3aed',
	amber: '#d97706',
	emerald: '#059669',
	rose: '#e11d48',
	indigo: '#4f46e5',
};
