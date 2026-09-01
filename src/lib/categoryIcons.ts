export const CATEGORY_ICON_KEYS = [
	// comida y bebida
	'utensils-crossed',
	'coffee',
	'beer',
	'pizza',
	'soup',
	'sandwich',
	'fish',
	'ice-cream',
	'wine',
	'chef-hat',
	'salad',
	// casa y personal
	'home',
	'scissors',
	'bath',
	'heart',
	// transporte
	'car',
	'plane',
	'bus',
	'train-front',
	'bike',
	// alojamiento
	'hotel',
	'building-2',
	'moon',
	'tent',
	// sitios y ocio
	'map-pin',
	'waves',
	'mountain',
	'building',
	'film',
	'music',
	'camera',
	'party-popper',
	'gift',
	'gamepad-2',
	'dumbbell',
	'shopping-bag',
	'shopping-cart',
	'flower-2',
	'lightbulb',
	'mic-2',
	'paw-print',
	'landmark',
	// trabajo
	'briefcase',
	'graduation-cap',
	'clipboard-check',
	// otros
	'wallet',
	'star',
	'book-open',
	'users',
	'sun',
	'sparkles',
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];
export const DEFAULT_CATEGORY_ICON: CategoryIconKey = 'star';

export function isCategoryIconKey(value: string): value is CategoryIconKey {
	return (CATEGORY_ICON_KEYS as readonly string[]).includes(value);
}
