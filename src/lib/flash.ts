const KEY = 'recapp_flash';

export function setFlashMessage(message: string) {
	sessionStorage.setItem(KEY, message);
}

export function consumeFlashMessage(): string | null {
	const message = sessionStorage.getItem(KEY);
	if (message) sessionStorage.removeItem(KEY);
	return message;
}
