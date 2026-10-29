import { and, asc, count, eq, inArray, ne } from 'drizzle-orm';
import type { Database } from './db/client.js';
import {
	bookmarks,
	deadlines,
	memberships,
	organisations,
	recordEvents,
	records,
	sessions,
	toolRuns,
	users
} from './db/schema.js';
import { listOrganisations, type OrganisationSummary } from './org.js';

/**
 * Daily's own users and their rights under Art. 15, 17 and 20 GDPR: what
 * Daily stores about them, a machine-readable copy, and deletion.
 */

export type AccountOrganisation = OrganisationSummary & { records: number; members: number };

export type AccountOverview = {
	user: { email: string; displayName: string; locale: string; createdAt: Date; lastLoginAt: Date };
	sessions: { createdAt: Date; expiresAt: Date }[];
	organisations: AccountOrganisation[];
};

async function recordCounts(db: Database, ids: string[]) {
	if (ids.length === 0) return new Map<string, number>();
	const rows = await db
		.select({ id: records.organisationId, n: count() })
		.from(records)
		.where(inArray(records.organisationId, ids))
		.groupBy(records.organisationId);
	return new Map(rows.map((row) => [row.id, row.n]));
}

async function memberCounts(db: Database, ids: string[]) {
	if (ids.length === 0) return new Map<string, number>();
	const rows = await db
		.select({ id: memberships.organisationId, n: count() })
		.from(memberships)
		.where(inArray(memberships.organisationId, ids))
		.groupBy(memberships.organisationId);
	return new Map(rows.map((row) => [row.id, row.n]));
}

/** what Daily stores about the user, for the account page */
export async function accountOverview(db: Database, userId: string): Promise<AccountOverview> {
	const [user] = await db
		.select({
			email: users.email,
			displayName: users.displayName,
			locale: users.locale,
			createdAt: users.createdAt,
			lastLoginAt: users.lastLoginAt
		})
		.from(users)
		.where(eq(users.id, userId));
	const userSessions = await db
		.select({ createdAt: sessions.createdAt, expiresAt: sessions.expiresAt })
		.from(sessions)
		.where(eq(sessions.userId, userId))
		.orderBy(asc(sessions.createdAt));
	const orgs = await listOrganisations(db, userId);
	const ids = orgs.map((org) => org.id);
	const [recordsBy, membersBy] = await Promise.all([recordCounts(db, ids), memberCounts(db, ids)]);
	return {
		user,
		sessions: userSessions,
		organisations: orgs.map((org) => ({
			...org,
			records: recordsBy.get(org.id) ?? 0,
			members: membersBy.get(org.id) ?? 1
		}))
	};
}

/**
 * a JSON copy of the user's data (Art. 15 and 20): the profile, session
 * metadata (never tokens), memberships, bookmarks, the user's saved tool
 * runs, and the full content of every organisation the user owns.
 */
export async function buildAccountExport(db: Database, userId: string, now: Date = new Date()) {
	const overview = await accountOverview(db, userId);
	const owned = overview.organisations.filter((org) => org.role === 'owner').map((org) => org.id);

	const [ownedRecords, ownedDeadlines, runs, saved] = await Promise.all([
		owned.length === 0
			? []
			: db.select().from(records).where(inArray(records.organisationId, owned)),
		owned.length === 0
			? []
			: db.select().from(deadlines).where(inArray(deadlines.organisationId, owned)),
		db.select().from(toolRuns).where(eq(toolRuns.userId, userId)),
		db
			.select({ itemId: bookmarks.itemId, createdAt: bookmarks.createdAt })
			.from(bookmarks)
			.where(eq(bookmarks.userId, userId))
	]);
	const recordIds = ownedRecords.map((record) => record.id);
	const events =
		recordIds.length === 0
			? []
			: await db.select().from(recordEvents).where(inArray(recordEvents.recordId, recordIds));

	return {
		format: 'daily-account-export',
		version: 1,
		exportedAt: now.toISOString(),
		user: overview.user,
		sessions: overview.sessions,
		bookmarks: saved,
		toolRuns: runs,
		organisations: overview.organisations.map((org) => {
			const isOwner = org.role === 'owner';
			const own = ownedRecords.filter((record) => record.organisationId === org.id);
			const ids = new Set(own.map((record) => record.id));
			return {
				id: org.id,
				name: org.name,
				kind: org.kind,
				role: org.role,
				...(isOwner
					? {
							records: own,
							recordEvents: events.filter((event) => ids.has(event.recordId)),
							deadlines: ownedDeadlines.filter((deadline) => deadline.organisationId === org.id)
						}
					: {})
			};
		})
	};
}

export type AccountExport = Awaited<ReturnType<typeof buildAccountExport>>;

export type DeleteResult =
	| { ok: true; organisations: number }
	/** organisations the user owns together with other members; ownership must move first */
	| { ok: false; error: 'shared'; organisations: string[] };

/**
 * deletes the user and everything only they can see (Art. 17): every
 * organisation they own alone, with its entries, history, deadlines and tool
 * runs (by cascade), then the user row with sessions, memberships and
 * bookmarks. Authorship in organisations of others becomes anonymous.
 * Refuses while the user owns an organisation that has other members.
 */
export async function deleteAccount(db: Database, userId: string): Promise<DeleteResult> {
	return db.transaction(async (tx) => {
		const owned = await tx
			.select({ id: organisations.id, name: organisations.name })
			.from(memberships)
			.innerJoin(organisations, eq(organisations.id, memberships.organisationId))
			.where(and(eq(memberships.userId, userId), eq(memberships.role, 'owner')));
		const ids = owned.map((org) => org.id);

		const shared =
			ids.length === 0
				? []
				: await tx
						.selectDistinct({ id: memberships.organisationId })
						.from(memberships)
						.where(and(inArray(memberships.organisationId, ids), ne(memberships.userId, userId)));
		if (shared.length > 0) {
			const names = new Set(shared.map((row) => row.id));
			return {
				ok: false,
				error: 'shared',
				organisations: owned.filter((org) => names.has(org.id)).map((org) => org.name)
			} as const;
		}

		if (ids.length > 0) await tx.delete(organisations).where(inArray(organisations.id, ids));
		// runs in organisations of others: user_id is NOT NULL, so they cannot be anonymised
		await tx.delete(toolRuns).where(eq(toolRuns.userId, userId));
		await tx.delete(users).where(eq(users.id, userId));
		return { ok: true, organisations: ids.length } as const;
	});
}
