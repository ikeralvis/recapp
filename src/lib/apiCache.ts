export function getCached<T>(key: string, ttlMs: number): T | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const { data, ts } = JSON.parse(raw);
		if (Date.now() - ts > ttlMs) return null;
		return data as T;
	} catch {
		return null;
	}
}

export function setCached(key: string, data: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
	} catch {
		// localStorage no disponible — sin caché, sin problema
	}
}
