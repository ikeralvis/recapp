import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { groupInvites, groupMembers } from '../../../../db/schema';
import { isGroupMember } from '../../../../lib/group';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const token = params.token ?? '';
	const invite = await db.select().from(groupInvites).where(eq(groupInvites.token, token)).get();
	if (!invite) {
		return Response.json({ error: 'Invitación no encontrada.' }, { status: 404 });
	}
	if (invite.usedBy) {
		return Response.json({ error: 'Esta invitación ya se ha usado.' }, { status: 409 });
	}
	if (invite.expiresAt.getTime() < Date.now()) {
		return Response.json({ error: 'Esta invitación ha caducado.' }, { status: 410 });
	}

	if (await isGroupMember(invite.groupId, locals.user.id)) {
		return Response.json({ error: 'Ya eres miembro de este grupo.' }, { status: 409 });
	}

	await db.insert(groupMembers).values({ groupId: invite.groupId, userId: locals.user.id, role: 'member' });
	await db.update(groupInvites).set({ usedBy: locals.user.id, usedAt: new Date() }).where(eq(groupInvites.id, invite.id));

	return Response.json({ groupId: invite.groupId });
};
