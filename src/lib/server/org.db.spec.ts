import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { loadEnv } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb } from './db/client.js';
import { memberships, organisations, users } from './db/schema.js';
import {
	cleanName,
	createClientOrganisation,
	listOrganisations,
	renameOrganisation,
	resolveOrganisation
} from './org.js';

/** Runs against the compose Postgres through `pnpm test:db`; see records.db.spec.ts. */
const url =
	process.env.npm_lifecycle_event === 'test:db'
		? loadEnv('', process.cwd(), '').DATABASE_URL
		: undefined;

describe('organisation names', () => {
	it('trims, collapses spaces and rejects empty or long names', () => {
		expect(cleanName('  Muster   GmbH ')).toBe('Muster GmbH');
		expect(cleanName('   ')).toBeNull();
		expect(cleanName('x'.repeat(121))).toBeNull();
		expect(cleanName(42)).toBeNull();
	});
});

describe.skipIf(!url)('organisations (Postgres)', () => {
	const db = createDb(url ?? '');
	const userId = randomUUID();
	const otherId = randomUUID();
	const created: string[] = [];
	let ownId = '';

	beforeAll(async () => {
		await db.insert(users).values([
			{ id: userId, email: `${userId}@test.invalid`, displayName: 'DSB Test' },
			{ id: otherId, email: `${otherId}@test.invalid`, displayName: 'Andere' }
		]);
		const [own] = await db
			.insert(organisations)
			.values({ name: 'Eigene', kind: 'eigene' })
			.returning();
		ownId = own.id;
		created.push(own.id);
		await db.insert(memberships).values({ userId, organisationId: own.id, role: 'owner' });
	});

	afterAll(async () => {
		await db.delete(organisations).where(inArray(organisations.id, created));
		await db.delete(users).where(inArray(users.id, [userId, otherId]));
	});

	it('adds client organisations after the own one', async () => {
		const client = await createClientOrganisation(db, userId, 'Mandant A');
		created.push(client.id);
		expect(client).toMatchObject({ kind: 'mandant', role: 'owner' });
		const list = await listOrganisations(db, userId);
		expect(list.map((o) => o.name)).toEqual(['Eigene', 'Mandant A']);
	});

	it('follows the cookie only for organisations the user belongs to', async () => {
		const [, client] = await listOrganisations(db, userId);
		expect((await resolveOrganisation(db, userId, client.id))?.id).toBe(client.id);
		expect((await resolveOrganisation(db, userId, undefined))?.id).toBe(ownId);
		const foreign = await createClientOrganisation(db, otherId, 'Fremd');
		created.push(foreign.id);
		expect((await resolveOrganisation(db, userId, foreign.id))?.id).toBe(ownId);
		expect(await resolveOrganisation(db, randomUUID(), undefined)).toBeUndefined();
	});

	it('lets only owners rename', async () => {
		const [, client] = await listOrganisations(db, userId);
		expect(await renameOrganisation(db, userId, client.id, 'Mandant B')).toBe(true);
		const [row] = await db.select().from(organisations).where(eq(organisations.id, client.id));
		expect(row.name).toBe('Mandant B');
		expect(await renameOrganisation(db, otherId, client.id, 'Übernahme')).toBe(false);
	});
});
