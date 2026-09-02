import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { pushSubscriptions } from '../db/schema';

let configured = false;
function ensureConfigured() {
	if (configured) return;
	webpush.setVapidDetails('mailto:recapp@example.com', process.env.PUBLIC_VAPID_KEY!, process.env.VAPID_PRIVATE_KEY!);
	configured = true;
}

export interface PushPayload {
	title: string;
	body: string;
	url?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
	ensureConfigured();
	const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

	await Promise.allSettled(
		subs.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					JSON.stringify(payload)
				);
			} catch (err: any) {
				if (err?.statusCode === 404 || err?.statusCode === 410) {
					await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
				} else {
					throw err;
				}
			}
		})
	);
}
