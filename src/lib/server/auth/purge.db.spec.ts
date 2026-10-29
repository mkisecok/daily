import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { loadEnv } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';
import { createDb } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { purgeExpiredSessions } from './purge.js';

/** runs against the compose Postgres through `pnpm test:db`, skipped otherwise */
const url =
	process.env.npm_lifecycle_event === 'test:db'
		? loadEnv('', process.cwd(), '').DATABASE_URL
		: undefined;

describe.skipIf(!url)('expired session purge (Postgres)', () => {
	const db = createDb(url ?? '');
	const userId = randomUUID();

	afterAll(async () => {
		await db.delete(users).where(eq(users.id, userId));
	});

	it('deletes expired sessions and keeps live ones', async () => {
		await db
			.insert(users)
			.values({ id: userId, email: `${userId}@test.invalid`, displayName: 'P' });
		const row = (id: string, expiresAt: Date) => ({
			id,
			userId,
			idToken: 'i',
			accessToken: 'a',
			accessExpiresAt: expiresAt,
			expiresAt
		});
		const now = new Date('2026-10-29T12:00:00.000Z');
		await db
			.insert(sessions)
			.values([
				row(`old-${userId}`, new Date('2026-10-28T12:00:00.000Z')),
				row(`live-${userId}`, new Date('2026-11-28T12:00:00.000Z'))
			]);

		expect(await purgeExpiredSessions(db, now)).toBeGreaterThanOrEqual(1);
		const left = await db
			.select({ id: sessions.id })
			.from(sessions)
			.where(eq(sessions.userId, userId));
		expect(left.map((s) => s.id)).toEqual([`live-${userId}`]);
	});
});
