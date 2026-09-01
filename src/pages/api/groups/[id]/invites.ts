import type { APIRoute } from 'astro';
import { db } from '../../../../db/client';
import { groupInvites } from '../../../../db/schema';
import { generateInviteToken, isGroupMember } from '../../../../lib/group';

export const prerender = false;

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const POST: APIRoute = async ({ params, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const groupId = Number(params.id);
	if (!Number.isInteger(groupId) || !(await isGroupMember(groupId, locals.user.id))) {
		return Response.json({ error: 'Grupo no encontrado.' }, { status: 404 });
	}

	const token = generateInviteToken();
	await db.insert(groupInvites).values({
		groupId,
		token,
		createdBy: locals.user.id,
		expiresAt: new Date(Date.now() + INVITE_TTL_MS),
		createdAt: new Date(),
	});

	return Response.json({ token }, { status: 201 });
};
