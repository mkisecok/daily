import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

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

export const toolShape = pgEnum('tool_shape', ['questionnaire', 'register', 'workflow']);

/**
 * One completed use of a questionnaire tool. `input` holds the answers,
 * `result` the engine's verdict, both frozen with the catalog version so a
 * later catalog change never rewrites history.
 */
export const toolRuns = pgTable(
	'tool_runs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organisationId: uuid('organisation_id')
			.notNull()
			.references(() => organisations.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'set null' }),
		toolSlug: text('tool_slug').notNull(),
		shape: toolShape('shape').notNull(),
		catalogVersion: integer('catalog_version').notNull(),
		input: jsonb('input').notNull(),
		result: jsonb('result').notNull(),
		verdict: text('verdict'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('tool_runs_org_tool_idx').on(table.organisationId, table.toolSlug, table.createdAt)
	]
);

/* ---------- records ---------- */

/**
 * One entry of a register or workflow tool. `data` is validated against the
 * tool definition of `definition_version`; `version` increments on every
 * change for optimistic locking. Archiving is a soft delete, so the history
 * stays available (accountability, Art. 5(2) DSGVO).
 */
export const records = pgTable(
	'records',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organisationId: uuid('organisation_id')
			.notNull()
			.references(() => organisations.id, { onDelete: 'cascade' }),
		toolSlug: text('tool_slug').notNull(),
		definitionVersion: integer('definition_version').notNull(),
		/** Null for registers, a workflow state id otherwise. */
		state: text('state'),
		title: text('title').notNull(),
		data: jsonb('data').notNull(),
		version: integer('version').notNull().default(1),
		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
		updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		archivedAt: timestamp('archived_at', { withTimezone: true })
	},
	(table) => [
		index('records_org_tool_idx').on(table.organisationId, table.toolSlug, table.updatedAt)
	]
);

export const recordEventKind = pgEnum('record_event_kind', [
	'created',
	'updated',
	'transition',
	'assessment',
	'archived'
]);

/** Append-only history of a record: who changed which fields, and when. */
export const recordEvents = pgTable(
	'record_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		recordId: uuid('record_id')
			.notNull()
			.references(() => records.id, { onDelete: 'cascade' }),
		userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
		kind: recordEventKind('kind').notNull(),
		changes: jsonb('changes').notNull().default({}),
		fromState: text('from_state'),
		toState: text('to_state'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('record_events_record_idx').on(table.recordId, table.createdAt)]
);

/**
 * Deadlines derived from records by the tool engines. Recomputed on every
 * save: open rows of the record are replaced, `done_at` marks those a
 * terminal state or archive closed.
 */
export const deadlines = pgTable(
	'deadlines',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organisationId: uuid('organisation_id')
			.notNull()
			.references(() => organisations.id, { onDelete: 'cascade' }),
		recordId: uuid('record_id')
			.notNull()
			.references(() => records.id, { onDelete: 'cascade' }),
		toolSlug: text('tool_slug').notNull(),
		kind: text('kind').notNull(),
		dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
		doneAt: timestamp('done_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('deadlines_org_due_idx').on(table.organisationId, table.doneAt, table.dueAt)]
);

/* ---------- feed ---------- */

export const feedSourceKind = pgEnum('feed_source_kind', ['rss', 'html']);
export const feedRegion = pgEnum('feed_region', ['eu', 'de', 'land']);

/** A publisher the worker polls. Rows are synced from `feed/sources.ts`. */
export const feedSources = pgTable('feed_sources', {
	id: uuid('id').primaryKey().defaultRandom(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	kind: feedSourceKind('kind').notNull(),
	url: text('url').notNull(),
	region: feedRegion('region').notNull(),
	/** 1 = authority, court or legislator; 2 = legal press. */
	tier: integer('tier').notNull().default(1),
	lang: text('lang').notNull().default('de'),
	active: boolean('active').notNull().default(true),
	lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
	lastItemAt: timestamp('last_item_at', { withTimezone: true }),
	lastError: text('last_error'),
	failureCount: integer('failure_count').notNull().default(0)
});

/** Title, excerpt and link only: never the article body. */
export const feedItems = pgTable(
	'feed_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		sourceId: uuid('source_id')
			.notNull()
			.references(() => feedSources.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		urlHash: text('url_hash').notNull().unique(),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
		fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
		lang: text('lang').notNull().default('de'),
		tags: text('tags').array().notNull().default([])
	},
	(table) => [
		index('feed_items_published_idx').on(table.publishedAt),
		index('feed_items_tags_idx').using('gin', table.tags)
	]
);

export const bookmarks = pgTable(
	'bookmarks',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		itemId: uuid('item_id')
			.notNull()
			.references(() => feedItems.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [primaryKey({ columns: [table.userId, table.itemId] })]
);

export type User = typeof users.$inferSelect;
export type ToolRun = typeof toolRuns.$inferSelect;
export type FeedSource = typeof feedSources.$inferSelect;
export type FeedItem = typeof feedItems.$inferSelect;
export type Organisation = typeof organisations.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
export type RecordEventRow = typeof recordEvents.$inferSelect;
export type DeadlineRow = typeof deadlines.$inferSelect;
