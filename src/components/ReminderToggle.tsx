import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff, BellRing } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = 'checking' | 'unsupported' | 'off' | 'on';

export default function ReminderToggle() {
	const [status, setStatus] = useState<Status>('checking');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			setStatus('unsupported');
			return;
		}
		navigator.serviceWorker.ready.then(async (reg) => {
			const sub = await reg.pushManager.getSubscription();
			setStatus(sub ? 'on' : 'off');
		});
	}, []);

	async function enable() {
		setLoading(true);
		try {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				toast.error('Necesitas dar permiso de notificaciones para activar los recordatorios.');
				setLoading(false);
				return;
			}

			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(import.meta.env.PUBLIC_VAPID_KEY),
			});

			await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(sub.toJSON()),
			});

			setStatus('on');
			toast.success('Recordatorios activados');
		} catch {
			toast.error('No se ha podido activar. Inténtalo de nuevo.');
		}
		setLoading(false);
	}

	async function disable() {
		setLoading(true);
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) {
				await fetch('/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ endpoint: sub.endpoint }),
				});
				await sub.unsubscribe();
			}
			setStatus('off');
			toast.success('Recordatorios desactivados');
		} catch {
			toast.error('No se ha podido desactivar.');
		}
		setLoading(false);
	}

	async function sendTest() {
		const res = await fetch('/api/push/test', { method: 'POST' });
		const body = await res.json().catch(() => ({}));
		if (res.ok) toast.success('Notificación de prueba enviada');
		else toast.error(body.error ?? 'No se ha podido enviar.');
	}

	if (status === 'unsupported') {
		return (
			<div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
				<p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
					<BellOff size={16} className="text-slate-400" /> Recordatorios
				</p>
				<p className="mt-1 text-xs text-slate-500">
					Tu navegador no soporta notificaciones push. En iPhone, primero añade RecApp a la pantalla de inicio.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
			<div className="flex items-center justify-between">
				<p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
					{status === 'on' ? <BellRing size={16} className="text-blue-600" /> : <Bell size={16} className="text-slate-400" />}
					Recordatorios
				</p>
				<button
					type="button"
					disabled={status === 'checking' || loading}
					onClick={status === 'on' ? disable : enable}
					className={`rounded-full px-4 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
						status === 'on' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'
					}`}
				>
					{status === 'on' ? 'Desactivar' : 'Activar'}
				</button>
			</div>
			<p className="text-xs text-slate-500">
				Si no has registrado nada, te avisamos por la tarde-noche para que no se te olvide.
			</p>
			{status === 'on' && (
				<button type="button" onClick={sendTest} className="self-start text-xs font-semibold text-blue-600 hover:underline">
					Enviar notificación de prueba
				</button>
			)}
		</div>
	);
}
