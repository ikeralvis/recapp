import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { groupMembers } from '../db/schema';

export function generateInviteToken() {
	return randomBytes(24).toString('base64url');
}

export async function isGroupMember(groupId: number, userId: number) {
	const membership = await db
		.select()
		.from(groupMembers)
		.where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
		.get();
	return !!membership;
}

export async function getUserGroupIds(userId: number) {
	const rows = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId));
	return rows.map((r) => r.groupId);
}
