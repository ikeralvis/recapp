import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '../db/client';
import { categories } from '../db/schema';
import { getUserGroupIds, isGroupMember } from './group';

export async function listAccessibleCategories(userId: number) {
	const groupIds = await getUserGroupIds(userId);

	const personalCondition = and(eq(categories.ownerType, 'user'), eq(categories.ownerId, userId));
	const groupCondition = groupIds.length > 0 ? and(eq(categories.ownerType, 'group'), inArray(categories.ownerId, groupIds)) : undefined;

	return db
		.select()
		.from(categories)
		.where(and(eq(categories.archived, false), groupCondition ? or(personalCondition, groupCondition) : personalCondition));
}

export async function canAccessCategory(userId: number, category: { ownerType: 'user' | 'group'; ownerId: number }) {
	if (category.ownerType === 'user') return category.ownerId === userId;
	return isGroupMember(category.ownerId, userId);
}

/** El historial/contador de la categoría solo muestra lo del propio usuario cuando es
 * personal, o de grupo con visibilidad "individual". La comparativa entre miembros
 * vive únicamente en Estadísticas. */
export function isPersonalView(category: { ownerType: 'user' | 'group'; visibility: 'individual' | 'shared' }) {
	return category.ownerType === 'user' || category.visibility === 'individual';
}
