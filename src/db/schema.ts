import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	name: text('name').notNull(),
	avatarColor: text('avatar_color').notNull().default('blue'),
	avatarStyle: text('avatar_style'),
	avatarSeed: text('avatar_seed').notNull().default(''),
	accentColor: text('accent_color').notNull().default('blue'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const groups = sqliteTable('groups', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	createdBy: integer('created_by').notNull().references(() => users.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const groupMembers = sqliteTable(
	'group_members',
	{
		groupId: integer('group_id').notNull().references(() => groups.id),
		userId: integer('user_id').notNull().references(() => users.id),
		role: text('role', { enum: ['owner', 'member'] }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })]
);

export const groupInvites = sqliteTable('group_invites', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	groupId: integer('group_id').notNull().references(() => groups.id),
	token: text('token').notNull().unique(),
	createdBy: integer('created_by').notNull().references(() => users.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	usedBy: integer('used_by').references(() => users.id),
	usedAt: integer('used_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ownerType: text('owner_type', { enum: ['user', 'group'] }).notNull(),
	ownerId: integer('owner_id').notNull(),
	name: text('name').notNull(),
	icon: text('icon'),
	kind: text('kind', { enum: ['counter', 'detailed'] }).notNull(),
	visibility: text('visibility', { enum: ['individual', 'shared'] }).notNull(),
	schemaJson: text('schema_json', { mode: 'json' }).notNull().default('[]'),
	archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
	createdBy: integer('created_by').notNull().references(() => users.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const entries = sqliteTable('entries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	categoryId: integer('category_id').notNull().references(() => categories.id),
	userId: integer('user_id').notNull().references(() => users.id),
	groupId: integer('group_id').references(() => groups.id),
	occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(),
	dataJson: text('data_json', { mode: 'json' }).notNull().default('{}'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const entryParticipants = sqliteTable('entry_participants', {
	entryId: integer('entry_id').notNull().references(() => entries.id),
	userId: integer('user_id').notNull().references(() => users.id),
});

export const trophies = sqliteTable(
	'trophies',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		categoryId: integer('category_id').notNull().references(() => categories.id),
		period: text('period').notNull(), // 'YYYY-MM' o 'YYYY'
		winnerUserId: integer('winner_user_id').references(() => users.id),
		value: integer('value').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	},
	(table) => [uniqueIndex('trophies_category_period_unique').on(table.categoryId, table.period)]
);

export const pushSubscriptions = sqliteTable('push_subscriptions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
