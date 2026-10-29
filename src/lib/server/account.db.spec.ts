import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { loadEnv } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildAccountExport, deleteAccount } from './account.js';
import { createDb } from './db/client.js';
import { memberships, organisations, records, sessions, toolRuns, users } from './db/schema.js';

/** runs against the compose Postgres through `pnpm test:db`, skipped otherwise */
const url =
	process.env.npm_lifecycle_event === 'test:db'
		? loadEnv('', process.cwd(), '').DATABASE_URL
		: undefined;

describe.skipIf(!url)('account export and deletion (Postgres)', () => {
	const db = createDb(url ?? '');
	const userId = randomUUID();
	const otherId = randomUUID();
	const orgs: string[] = [];
	let ownId = '';
	let sharedId = '';

	beforeAll(async () => {
		await db.insert(users).values([
			{ id: userId, email: `${userId}@test.invalid`, displayName: 'Konto' },
			{ id: otherId, email: `${otherId}@test.invalid`, displayName: 'Andere' }
		]);
		const [own, shared] = await db
			.insert(organisations)
			.values([
				{ name: 'Eigene', kind: 'eigene' },
				{ name: 'Fremd', kind: 'mandant' }
			])
			.returning();
		ownId = own.id;
		sharedId = shared.id;
		orgs.push(own.id, shared.id);
		await db.insert(memberships).values([
			{ userId, organisationId: ownId, role: 'owner' },
			{ userId: otherId, organisationId: sharedId, role: 'owner' },
			{ userId, organisationId: sharedId, role: 'member' }
		]);
		await db.insert(records).values({
			organisationId: ownId,
			toolSlug: 'vvt',
			definitionVersion: 1,
			title: 'Newsletter',
			data: { bezeichnung: 'Newsletter' },
			createdBy: userId,
			updatedBy: userId
		});
		await db.insert(sessions).values({
			id: `s-${userId}`,
			userId,
			idToken: 'secret-id-token',
			accessToken: 'secret-access-token',
			accessExpiresAt: new Date(Date.now() + 60_000),
			expiresAt: new Date(Date.now() + 86_400_000)
		});
		await db.insert(toolRuns).values({
			organisationId: sharedId,
			userId,
			toolSlug: 'dsfa-schwellwert',
			shape: 'questionnaire',
			catalogVersion: 1,
			input: {},
			result: {}
		});
	});

	afterAll(async () => {
		await db.delete(organisations).where(inArray(organisations.id, orgs));
		await db.delete(users).where(inArray(users.id, [userId, otherId]));
	});

	it('exports owned content and memberships but never tokens', async () => {
		const exported = await buildAccountExport(db, userId);
		const text = JSON.stringify(exported);
		expect(text).not.toContain('secret-');
		expect(exported.sessions).toHaveLength(1);
		expect(exported.toolRuns).toHaveLength(1);
		const own = exported.organisations.find((org) => org.id === ownId);
		const shared = exported.organisations.find((org) => org.id === sharedId);
		expect(own?.records?.map((record) => record.title)).toEqual(['Newsletter']);
		expect(shared).toEqual({ id: sharedId, name: 'Fremd', kind: 'mandant', role: 'member' });
	});

	it('refuses while an owned organisation has other members', async () => {
		await db.insert(memberships).values({ userId: otherId, organisationId: ownId, role: 'member' });
		expect(await deleteAccount(db, userId)).toEqual({
			ok: false,
			error: 'shared',
			organisations: ['Eigene']
		});
		await db.delete(memberships).where(eq(memberships.userId, otherId));
		await db
			.insert(memberships)
			.values({ userId: otherId, organisationId: sharedId, role: 'owner' });
	});

	it('deletes the user, their own organisation and their runs elsewhere', async () => {
		expect(await deleteAccount(db, userId)).toEqual({ ok: true, organisations: 1 });
		expect(await db.select().from(users).where(eq(users.id, userId))).toEqual([]);
		expect(await db.select().from(organisations).where(eq(organisations.id, ownId))).toEqual([]);
		expect(await db.select().from(sessions).where(eq(sessions.userId, userId))).toEqual([]);
		expect(await db.select().from(toolRuns).where(eq(toolRuns.organisationId, sharedId))).toEqual(
			[]
		);
		expect(
			await db.select().from(organisations).where(eq(organisations.id, sharedId))
		).toHaveLength(1);
	});
});
