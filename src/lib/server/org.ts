import { asc, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { memberships } from './db/schema.js';

/**
 * The organisation a user currently works in. Until the Mandanten switcher
 * exists this is the oldest membership, which is the user's own organisation
 * created on first login.
 */
export async function getActiveOrganisationId(userId: string): Promise<string | undefined> {
	const row = await db
		.select({ organisationId: memberships.organisationId })
		.from(memberships)
		.where(eq(memberships.userId, userId))
		.orderBy(asc(memberships.createdAt))
		.limit(1)
		.then((rows) => rows[0]);
	return row?.organisationId;
}
