const CACHE_KEY = 'recapp_groups_cache';
const TTL_MS = 5 * 60 * 1000;

export function getCachedGroups<T>(): T | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const { data, ts } = JSON.parse(raw);
		if (Date.now() - ts > TTL_MS) return null;
		return data as T;
	} catch {
		return null;
	}
}

export function setCachedGroups(data: unknown) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
	} catch {
		// localStorage no disponible (modo privado, etc.) — sin caché, sin problema
	}
}
