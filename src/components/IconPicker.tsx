import { useState } from 'react';
import {
	UtensilsCrossed,
	Coffee,
	Beer,
	Pizza,
	Soup,
	Sandwich,
	Fish,
	IceCream,
	Wine,
	ChefHat,
	Salad,
	Home,
	Scissors,
	Bath,
	Heart,
	Car,
	Plane,
	Bus,
	TrainFront,
	Bike,
	Hotel,
	Building2,
	Moon,
	Tent,
	MapPin,
	Waves,
	Mountain,
	Building,
	Film,
	Music,
	Camera,
	PartyPopper,
	Gift,
	Gamepad2,
	Dumbbell,
	ShoppingBag,
	ShoppingCart,
	Flower2,
	Lightbulb,
	Mic2,
	PawPrint,
	Landmark,
	Briefcase,
	GraduationCap,
	ClipboardCheck,
	Wallet,
	Star,
	BookOpen,
	Users,
	Sun,
	Sparkles,
	ChevronDown,
	type LucideIcon,
} from 'lucide-react';
import { CATEGORY_ICON_KEYS, DEFAULT_CATEGORY_ICON, isCategoryIconKey, type CategoryIconKey } from '../lib/categoryIcons';

const ICONS: Record<CategoryIconKey, LucideIcon> = {
	'utensils-crossed': UtensilsCrossed,
	coffee: Coffee,
	beer: Beer,
	pizza: Pizza,
	soup: Soup,
	sandwich: Sandwich,
	fish: Fish,
	'ice-cream': IceCream,
	wine: Wine,
	'chef-hat': ChefHat,
	salad: Salad,
	home: Home,
	scissors: Scissors,
	bath: Bath,
	heart: Heart,
	car: Car,
	plane: Plane,
	bus: Bus,
	'train-front': TrainFront,
	bike: Bike,
	hotel: Hotel,
	'building-2': Building2,
	moon: Moon,
	tent: Tent,
	'map-pin': MapPin,
	waves: Waves,
	mountain: Mountain,
	building: Building,
	film: Film,
	music: Music,
	camera: Camera,
	'party-popper': PartyPopper,
	gift: Gift,
	'gamepad-2': Gamepad2,
	dumbbell: Dumbbell,
	'shopping-bag': ShoppingBag,
	'shopping-cart': ShoppingCart,
	'flower-2': Flower2,
	lightbulb: Lightbulb,
	'mic-2': Mic2,
	'paw-print': PawPrint,
	landmark: Landmark,
	briefcase: Briefcase,
	'graduation-cap': GraduationCap,
	'clipboard-check': ClipboardCheck,
	wallet: Wallet,
	star: Star,
	'book-open': BookOpen,
	users: Users,
	sun: Sun,
	sparkles: Sparkles,
};

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
