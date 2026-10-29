import { lt } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { sessions } from '../db/schema.js';

/**
 * deletes sessions past their expiry together with the Keycloak tokens they
 * hold. A session normally ends on logout or when its expired cookie comes
 * back; this catches the ones whose browser never returns (Art. 5(1)(e)
 * GDPR). Run daily by the worker.
 */
export async function purgeExpiredSessions(db: Database, now: Date = new Date()): Promise<number> {
	const deleted = await db
		.delete(sessions)
		.where(lt(sessions.expiresAt, now))
		.returning({ id: sessions.id });
	return deleted.length;
}
