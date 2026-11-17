import { describe, expect, it } from 'vitest';
import {
	backupFileName,
	BACKUP_VERSION,
	makeBackup,
	planRestore,
	readBackup,
	type Backup
} from './backup.js';
import { linkedTool, testTool } from './fixtures.js';
import { createBrowserStore } from './store/browser.js';
import type { RecordTool } from './types.js';

const tools: Record<string, RecordTool> = {
	[testTool.definition.slug]: testTool,
	[linkedTool.definition.slug]: linkedTool
};
const getTool = (slug: string) => tools[slug];

function browserStore(prefix: string) {
	const items = new Map<string, string>();
	let id = 0;
	return createBrowserStore(
		{
			getItem: (key) => items.get(key) ?? null,
			setItem: (key, value) => void items.set(key, value),
			removeItem: (key) => void items.delete(key)
		},
		{ getTool, now: () => new Date('2026-11-17T08:00:00Z'), newId: () => `${prefix}-${++id}` }
	);
}

/** a workspace with an entry, a second one pointing to it, and an edit in the history */
async function workspace() {
	const store = browserStore('a');
	const target = await store.create('test-register', { name: 'Ziel', due: '2026-12-01' });
	if (!target.ok) throw new Error('create failed');
	const edited = await store.update(target.value.id, { name: 'Ziel neu', due: '2026-12-01' }, 1);
	if (!edited.ok) throw new Error('update failed');
	const linked = await store.create('linked-register', {
		name: 'Verweis',
		target: target.value.id
	});
	if (!linked.ok) throw new Error('create failed');
	return { store, target: target.value, linked: linked.value };
}

describe('backup', () => {
	it('brings every entry back elsewhere with its history, links and deadlines', async () => {
		const { store, target, linked } = await workspace();
		const file = JSON.parse(JSON.stringify(makeBackup(await store.backup())));

		const other = browserStore('b');
		expect(await other.restore(readBackup(file) as Backup)).toEqual({
			added: 2,
			present: 0,
			unreadable: 0
		});
		const back = await other.get(linked.id);
		expect(back?.record.data.target).toBe(target.id);
		const history = await other.get(target.id);
		expect(history?.record.title).toBe('Ziel neu');
		expect(history?.events.map((event) => event.kind)).toEqual(['created', 'updated']);
		expect(history?.deadlines).toHaveLength(1);
	});

	it('keeps entries already here and adds nothing twice', async () => {
		const { store } = await workspace();
		const backup = makeBackup(await store.backup());
		expect(await store.restore(backup)).toEqual({ added: 0, present: 2, unreadable: 0 });
		expect(await store.list('test-register')).toHaveLength(1);
	});

	it('gives an entry a new id when its id is taken elsewhere, and the link follows', async () => {
		const { store, target, linked } = await workspace();
		const plan = planRestore(makeBackup(await store.backup()), {
			here: () => false,
			free: (id) => id !== target.id,
			getTool,
			newId: () => 'neu-1'
		});
		const ids = plan.records.map((record) => record.id);
		expect(ids).toContain('neu-1');
		expect(ids).toContain(linked.id);
		expect(plan.records.find((r) => r.id === linked.id)?.data.target).toBe('neu-1');
		expect(plan.events.every((event) => ids.includes(event.recordId))).toBe(true);
	});

	it('counts entries of unknown tools or states as not readable', async () => {
		const { store } = await workspace();
		const backup = makeBackup(await store.backup());
		backup.records.push(
			{ ...backup.records[0], id: 'x-1', toolSlug: 'gibt-es-nicht' },
			{ ...backup.records[0], id: 'x-2', state: 'erfunden' }
		);
		const plan = planRestore(backup, {
			here: () => false,
			free: () => true,
			getTool,
			newId: () => 'n'
		});
		expect([plan.added, plan.unreadable]).toEqual([2, 2]);
	});

	it('refuses a file that is not a backup or comes from a newer Daily', () => {
		expect(readBackup({ records: [] })).toEqual({ error: 'format' });
		expect(readBackup('text')).toEqual({ error: 'format' });
		expect(
			readBackup({ format: 'daily-backup', version: BACKUP_VERSION + 1, records: [], events: [] })
		).toEqual({ error: 'version' });
	});

	it('names the file after the workspace and the day', () => {
		const day = new Date('2026-11-17T10:00:00Z');
		expect(backupFileName('Muster & Söhne GmbH', day)).toBe(
			'daily-muster-sohne-gmbh-2026-11-17.json'
		);
		expect(backupFileName(null, day)).toBe('daily-2026-11-17.json');
	});
});
