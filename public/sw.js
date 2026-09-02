self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
	// Sin caché propia por ahora: todo pasa por red.
});

self.addEventListener('push', (event) => {
	let data = { title: 'RecApp', body: 'Tienes algo nuevo.', url: '/app' };
	try {
		if (event.data) data = { ...data, ...event.data.json() };
	} catch {
		// payload no era JSON, usamos los valores por defecto
	}

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: '/icon-192.png',
			badge: '/icon-192.png',
			data: { url: data.url || '/app' },
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/app';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if (client.url.includes(url) && 'focus' in client) return client.focus();
			}
			if (self.clients.openWindow) return self.clients.openWindow(url);
		})
	);
});
