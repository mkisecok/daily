import { and, asc, eq } from 'drizzle-orm';
import type { Database } from './db/client.js';
import { memberships, organisations } from './db/schema.js';

/** Cookie naming the organisation a user works in; checked against memberships. */
export const ORG_COOKIE = 'daily_org';

export const MAX_NAME = 120;

export type OrganisationSummary = {
	id: string;
	name: string;
	kind: 'eigene' | 'mandant';
	role: 'owner' | 'member';
};

/** The user's organisations: the own one first, then clients in the order added. */
export async function listOrganisations(
	db: Database,
	userId: string
): Promise<OrganisationSummary[]> {
	return db
		.select({
			id: organisations.id,
			name: organisations.name,
			kind: organisations.kind,
			role: memberships.role
		})
		.from(memberships)
		.innerJoin(organisations, eq(organisations.id, memberships.organisationId))
		.where(eq(memberships.userId, userId))
		.orderBy(asc(memberships.createdAt), asc(organisations.name));
}

/**
 * The organisation a user currently works in: the one named by the cookie
 * if the user is a member, otherwise the oldest membership, which is the
 * user's own organisation created on first login.
 */
export async function resolveOrganisation(
	db: Database,
	userId: string,
	preferred: string | undefined
): Promise<OrganisationSummary | undefined> {
	const all = await listOrganisations(db, userId);
	return all.find((org) => org.id === preferred) ?? all[0];
}

/** A trimmed organisation name, or null when empty or too long. */
export function cleanName(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;
	const name = raw.trim().replace(/\s+/g, ' ');
	return name.length > 0 && name.length <= MAX_NAME ? name : null;
}

/** Adds a client organisation (kind `mandant`) owned by the user. */
export async function createClientOrganisation(
	db: Database,
	userId: string,
	name: string
): Promise<OrganisationSummary> {
	return db.transaction(async (tx) => {
		const [org] = await tx.insert(organisations).values({ name, kind: 'mandant' }).returning();
		await tx.insert(memberships).values({ userId, organisationId: org.id, role: 'owner' });
		return { id: org.id, name: org.name, kind: org.kind, role: 'owner' as const };
	});
}

/** Renames an organisation the user owns; false when not allowed. */
export async function renameOrganisation(
	db: Database,
	userId: string,
	organisationId: string,
	name: string
): Promise<boolean> {
	const [membership] = await db
		.select({ role: memberships.role })
		.from(memberships)
		.where(and(eq(memberships.userId, userId), eq(memberships.organisationId, organisationId)));
	if (membership?.role !== 'owner') return false;
	await db.update(organisations).set({ name }).where(eq(organisations.id, organisationId));
	return true;
}
