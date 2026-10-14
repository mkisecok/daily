import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { loadEnv } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testTool } from '../records/fixtures.js';
import type { RecordStore } from '../records/store/types.js';
import { createDb } from './db/client.js';
import { deadlines, memberships, organisations, users } from './db/schema.js';
import { createRecordRepository } from './records.js';

/**
 * Runs against the migrated compose Postgres from `.env`, only through
 * `pnpm test:db`; skipped otherwise, so CI without a database stays green.
 */
const url =
	process.env.npm_lifecycle_event === 'test:db'
		? loadEnv('', process.cwd(), '').DATABASE_URL
		: undefined;

describe.skipIf(!url)('record repository (Postgres)', () => {
	const db = createDb(url ?? '');
	const repo = createRecordRepository(db, (slug) =>
		slug === testTool.definition.slug ? testTool : undefined
	);
	const userId = randomUUID();
	let organisationId = '';
	let store: RecordStore;
	let other: RecordStore;

	beforeAll(async () => {
		await db.insert(users).values({
			id: userId,
			email: `${userId}@test.invalid`,
			displayName: 'Prüferin Test'
		});
		const [org] = await db
			.insert(organisations)
			.values({ name: 'Testorganisation', kind: 'eigene' })
			.returning();
		const [foreign] = await db
			.insert(organisations)
			.values({ name: 'Fremde Organisation', kind: 'mandant' })
			.returning();
		organisationId = org.id;
		await db.insert(memberships).values({ userId, organisationId, role: 'owner' });
		store = repo.forOrganisation(organisationId, userId);
		other = repo.forOrganisation(foreign.id, userId);
	});

	afterAll(async () => {
		await db.delete(organisations).where(eq(organisations.name, 'Testorganisation'));
		await db.delete(organisations).where(eq(organisations.name, 'Fremde Organisation'));
		await db.delete(users).where(eq(users.id, userId));
	});

	it('creates a record in the initial state with a history event', async () => {
		const result = await store.create('test-register', { name: ' Erster Eintrag ', kind: 'a' });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toMatchObject({ title: 'Erster Eintrag', state: 'open', version: 1 });
		const detail = await store.get(result.value.id);
		expect(detail?.events.map((e) => e.kind)).toEqual(['created']);
		expect(detail?.events[0].author).toBe('Prüferin Test');
	});

	it('rejects invalid input and unknown tools', async () => {
		expect(await store.create('test-register', { kind: 'nope' })).toMatchObject({
			ok: false,
			error: 'invalid',
			errors: { name: 'required', kind: 'invalid' }
		});
		expect(await store.create('unknown', { name: 'x' })).toMatchObject({ error: 'unknown-tool' });
	});

	it('updates with optimistic locking and records the changed fields', async () => {
		const created = await store.create('test-register', { name: 'Sperre' });
		if (!created.ok) throw new Error('create failed');
		const id = created.value.id;
		const updated = await store.update(id, { name: 'Sperre', due: '2026-11-02' }, 1);
		expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
		const stale = await store.update(id, { name: 'Später' }, 1);
		expect(stale).toMatchObject({ ok: false, error: 'conflict', current: { version: 2 } });
		const detail = await store.get(id);
		expect(detail?.events[1].changes).toEqual({ due: [null, '2026-11-02'] });
		expect(detail?.deadlines.map((d) => d.dueAt)).toEqual(['2026-11-02T00:00:00.000Z']);
	});

	it('keeps records of other organisations apart', async () => {
		const created = await store.create('test-register', { name: 'Geheim' });
		if (!created.ok) throw new Error('create failed');
		expect(await other.get(created.value.id)).toBeNull();
		expect(await other.update(created.value.id, { name: 'x' }, 1)).toMatchObject({
			error: 'not-found'
		});
		expect((await other.list('test-register')).length).toBe(0);
	});

	it('moves through the workflow and closes deadlines in the terminal state', async () => {
		const created = await store.create('test-register', {
			name: 'Ablauf',
			kind: 'b',
			due: '2026-10-30'
		});
		if (!created.ok) throw new Error('create failed');
		const id = created.value.id;
		expect((await store.deadlines()).some((d) => d.recordId === id)).toBe(true);
		expect(await store.transition(id, 'done', 1)).toMatchObject({ error: 'not-allowed' });
		const review = await store.transition(id, 'review', 1);
		expect(review).toMatchObject({ ok: true, value: { state: 'review', version: 2 } });
		const done = await store.transition(id, 'done', 2);
		expect(done).toMatchObject({ ok: true, value: { state: 'done' } });
		expect((await store.deadlines()).some((d) => d.recordId === id)).toBe(false);
		const rows = await db.select().from(deadlines).where(eq(deadlines.recordId, id));
		expect(rows).toHaveLength(1);
		expect(rows[0].doneAt).not.toBeNull();
	});

	it('attaches an assessment and keeps it through form updates', async () => {
		const created = await store.create('test-register', { name: 'Bewertet' });
		if (!created.ok) throw new Error('create failed');
		const id = created.value.id;
		const snapshot = {
			tool: 'demo',
			catalogVersion: 1,
			verdict: 'conditional' as const,
			headline: { de: 'Bedingt', en: 'Conditional' },
			at: '2026-10-14T10:00:00.000Z'
		};
		expect(await store.attachAssessment(id, 'name', snapshot)).toMatchObject({
			error: 'not-allowed'
		});
		const attached = await store.attachAssessment(id, 'check', snapshot, { kind: 'a' });
		expect(attached).toMatchObject({ ok: true, value: { data: { check: snapshot, kind: 'a' } } });
		const edited = await store.update(id, { name: 'Bewertet, geändert', kind: 'a' }, 2);
		expect(edited).toMatchObject({ ok: true, value: { data: { check: snapshot } } });
	});

	it('archives instead of deleting', async () => {
		const created = await store.create('test-register', { name: 'Alt', due: '2026-12-01' });
		if (!created.ok) throw new Error('create failed');
		const id = created.value.id;
		expect(await store.archive(id)).toMatchObject({ ok: true });
		expect((await store.list('test-register')).some((r) => r.id === id)).toBe(false);
		const detail = await store.get(id);
		expect(detail?.record.archivedAt).not.toBeNull();
		expect(detail?.events.at(-1)?.kind).toBe('archived');
		expect(await store.update(id, { name: 'x' }, 2)).toMatchObject({ error: 'not-allowed' });
		expect((await store.deadlines()).some((d) => d.recordId === id)).toBe(false);
	});
});
