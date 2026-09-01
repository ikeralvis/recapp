import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { groupInvites, groups, users } from '../../../db/schema';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const token = params.token ?? '';
	const invite = await db.select().from(groupInvites).where(eq(groupInvites.token, token)).get();
	if (!invite) {
		return Response.json({ error: 'Invitación no encontrada.' }, { status: 404 });
	}

	const group = await db.select().from(groups).where(eq(groups.id, invite.groupId)).get();
	const inviter = await db.select().from(users).where(eq(users.id, invite.createdBy)).get();

	return Response.json({
		groupName: group?.name ?? 'Grupo',
		inviterName: inviter?.name ?? '',
		expired: invite.expiresAt.getTime() < Date.now(),
		used: !!invite.usedBy,
	});
};
