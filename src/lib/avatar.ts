export const DICEBEAR_STYLES = ['avataaars', 'bottts', 'personas', 'adventurer', 'fun-emoji', 'notionists-neutral'] as const;
export type DicebearStyle = (typeof DICEBEAR_STYLES)[number];

export function isDicebearStyle(value: string): value is DicebearStyle {
	return (DICEBEAR_STYLES as readonly string[]).includes(value);
}

export function buildAvatarUrl(style: string, seed: string) {
	return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed || 'recapp')}`;
}

export function randomSeed() {
	return Math.random().toString(36).slice(2, 10);
}
