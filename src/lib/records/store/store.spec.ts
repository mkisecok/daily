import { describe, expect, it } from 'vitest';
import { testTool } from '../fixtures.js';
import { createBrowserStore, STORAGE_KEY } from './browser.js';
import { createHttpStore } from './http.js';

function fakeStorage() {
	const items = new Map<string, string>();
	return {
		items,
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value),
		removeItem: (key: string) => void items.delete(key)
	};
}

function browserStore(storage = fakeStorage()) {
	let tick = 0;
	let id = 0;
	return createBrowserStore(storage, {
		getTool: (slug) => (slug === testTool.definition.slug ? testTool : undefined),
		now: () => new Date(Date.UTC(2026, 9, 14, 8, 0, tick++)),
		newId: () => `id-${++id}`
	});
}

describe('browser store', () => {
	it('creates, persists and reads records with history', async () => {
		const storage = fakeStorage();
		const store = browserStore(storage);
		const created = await store.create('test-register', { name: 'Eins', due: '2026-10-20' });
		expect(created).toMatchObject({
			ok: true,
			value: { title: 'Eins', state: 'open', version: 1 }
		});
		expect(storage.items.has(STORAGE_KEY)).toBe(true);

		const reopened = browserStore(storage);
		const list = await reopened.list('test-register');
		expect(list.map((r) => r.title)).toEqual(['Eins']);
		const detail = await reopened.get(list[0].id);
		expect(detail?.events.map((e) => e.kind)).toEqual(['created']);
		expect(detail?.deadlines.map((d) => d.kind)).toEqual(['due']);
	});

	it('applies the shared rules: validation, locking, transitions', async () => {
		const store = browserStore();
		expect(await store.create('test-register', {})).toMatchObject({ error: 'invalid' });
		const created = await store.create('test-register', { name: 'Zwei' });
		if (!created.ok) throw new Error('create failed');
		const id = created.value.id;
		expect(await store.transition(id, 'review', 1)).toMatchObject({
			error: 'missing',
			missing: ['kind']
		});
		const edited = await store.update(id, { name: 'Zwei', kind: 'a' }, 1);
		expect(edited).toMatchObject({ ok: true, value: { version: 2 } });
		expect(await store.update(id, { name: 'Alt' }, 1)).toMatchObject({ error: 'conflict' });
		expect(await store.transition(id, 'review', 2)).toMatchObject({
			ok: true,
			value: { state: 'review' }
		});
		const detail = await store.get(id);
		expect(detail?.events.map((e) => e.kind)).toEqual(['created', 'updated', 'transition']);
		expect(detail?.events[2]).toMatchObject({ fromState: 'open', toState: 'review' });
	});

	it('lists open deadlines across records and drops archived ones', async () => {
		const store = browserStore();
		const a = await store.create('test-register', { name: 'A', due: '2026-10-30' });
		await store.create('test-register', { name: 'B', due: '2026-10-21' });
		if (!a.ok) throw new Error('create failed');
		expect((await store.deadlines()).map((d) => d.recordTitle)).toEqual(['B', 'A']);
		await store.archive(a.value.id);
		expect((await store.deadlines()).map((d) => d.recordTitle)).toEqual(['B']);
		expect((await store.list('test-register')).map((r) => r.title)).toEqual(['B']);
	});

	it('survives broken or blocked storage and can be cleared', async () => {
		const storage = fakeStorage();
		storage.items.set(STORAGE_KEY, '{not json');
		const store = browserStore(storage);
		expect(await store.list('test-register')).toEqual([]);
		await store.create('test-register', { name: 'Neu' });
		store.clear();
		expect(storage.items.has(STORAGE_KEY)).toBe(false);

		const blocked = createBrowserStore(
			{
				getItem: () => {
					throw new Error('SecurityError');
				},
				setItem: () => {
					throw new Error('QuotaExceededError');
				},
				removeItem: () => {
					throw new Error('SecurityError');
				}
			},
			{ getTool: () => testTool }
		);
		expect(await blocked.list('test-register')).toEqual([]);
		await expect(blocked.create('test-register', { name: 'x' })).rejects.toThrow();
		expect(() => blocked.clear()).not.toThrow();
	});
});

describe('http store', () => {
	const urls = {
		records: '/api/records',
		record: (id: string) => `/api/records/${id}`,
		deadlines: '/api/deadlines'
	};

	function fakeFetch(status: number, body: unknown) {
		const calls: { url: string; init?: RequestInit }[] = [];
		const fetchFn = (async (url: string, init?: RequestInit) => {
			calls.push({ url, init });
			return new Response(JSON.stringify(body), { status });
		}) as typeof fetch;
		return { calls, fetchFn };
	}

	it('sends JSON and returns the stored record', async () => {
		const { calls, fetchFn } = fakeFetch(200, { id: 'r1', version: 3 });
		const store = createHttpStore(urls, fetchFn);
		const result = await store.update('r1', { name: 'x' }, 2);
		expect(result).toEqual({ ok: true, value: { id: 'r1', version: 3 } });
		expect(calls[0].url).toBe('/api/records/r1');
		expect(calls[0].init?.method).toBe('PUT');
		expect(JSON.parse(String(calls[0].init?.body))).toEqual({
			data: { name: 'x' },
			expectedVersion: 2
		});
	});

	it('returns store errors and throws on everything else', async () => {
		const conflict = { ok: false, error: 'conflict', current: { id: 'r1' } };
		const store = createHttpStore(urls, fakeFetch(409, conflict).fetchFn);
		expect(await store.transition('r1', 'done', 1)).toEqual(conflict);
		const broken = createHttpStore(urls, fakeFetch(500, { message: 'boom' }).fetchFn);
		await expect(broken.create('t', {})).rejects.toThrow('500');
		const missing = createHttpStore(urls, fakeFetch(404, { message: 'Not found' }).fetchFn);
		expect(await missing.get('nope')).toBeNull();
	});
});
