import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { groups, groupMembers, users } from '../../../db/schema';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const memberships = await db
		.select({ groupId: groupMembers.groupId })
		.from(groupMembers)
		.where(eq(groupMembers.userId, locals.user.id));

	const result = [];
	for (const { groupId } of memberships) {
		const group = await db.select().from(groups).where(eq(groups.id, groupId)).get();
		if (!group) continue;
		const members = await db
			.select({ id: users.id, name: users.name })
			.from(groupMembers)
			.innerJoin(users, eq(users.id, groupMembers.userId))
			.where(eq(groupMembers.groupId, groupId));
		result.push({ ...group, members });
	}

	return Response.json(result);
};

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'No autenticado.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	if (!name) {
		return Response.json({ error: 'Ponle un nombre al grupo.' }, { status: 400 });
	}

	const group = await db.insert(groups).values({ name, createdBy: locals.user.id, createdAt: new Date() }).returning().get();
	await db.insert(groupMembers).values({ groupId: group.id, userId: locals.user.id, role: 'owner' });

	return Response.json({ ...group, members: [{ id: locals.user.id, name: locals.user.name }] }, { status: 201 });
};
