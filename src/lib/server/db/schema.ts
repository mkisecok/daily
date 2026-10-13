import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Keycloak is the identity provider; `id` is its `sub`. */
export const users = pgTable('users', {
	id: uuid('id').primaryKey(),
	email: text('email').notNull().unique(),
	displayName: text('display_name').notNull(),
	locale: text('locale').notNull().default('de'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }).notNull().defaultNow()
});

export const organisationKind = pgEnum('organisation_kind', ['eigene', 'mandant']);

/**
 * Every tool record belongs to an organisation. A user's own organisation
 * (kind `eigene`) is created on first login; external DSBs add clients
 * (kind `mandant`).
 */
export const organisations = pgTable('organisations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	kind: organisationKind('kind').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const membershipRole = pgEnum('membership_role', ['owner', 'member']);

export const memberships = pgTable(
	'memberships',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		organisationId: uuid('organisation_id')
			.notNull()
			.references(() => organisations.id, { onDelete: 'cascade' }),
		role: membershipRole('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.userId, table.organisationId] })]
);

/**
 * Server-side sessions. The browser holds only the random id; Keycloak
 * tokens stay here so they never reach client code.
 */
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	idToken: text('id_token').notNull(),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token'),
	accessExpiresAt: timestamp('access_expires_at', { withTimezone: true }).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type Organisation = typeof organisations.$inferSelect;
export type Session = typeof sessions.$inferSelect;
