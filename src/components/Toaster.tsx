import { useEffect } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { consumeFlashMessage } from '../lib/flash';

export default function Toaster() {
	useEffect(() => {
		const message = consumeFlashMessage();
		if (message) toast.success(message);
	}, []);

	return <Sonner position="top-center" richColors closeButton />;
}
