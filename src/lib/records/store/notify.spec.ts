import { describe, expect, it, vi } from 'vitest';
import { notifying } from './notify.js';
import type { RecordStore } from './types.js';

const ok = { ok: true as const, value: {} as never };

function fakeStore(): RecordStore & { clear: () => void } {
	return {
		list: vi.fn(async () => []),
		get: vi.fn(async () => null),
		create: vi.fn(async () => ok),
		update: vi.fn(async () => ok),
		transition: vi.fn(async () => ok),
		attachAssessment: vi.fn(async () => ok),
		archive: vi.fn(async () => ok),
		deadlines: vi.fn(async () => []),
		clear: vi.fn()
	};
}

describe('store change notifications', () => {
	it('tells listeners after every write and after clearing, not after reads', async () => {
		const changed = vi.fn();
		const store = notifying(fakeStore(), changed);
		await store.list('x');
		await store.get('1');
		await store.deadlines();
		expect(changed).not.toHaveBeenCalled();

		await store.create('x', {});
		await store.update('1', {}, 1);
		await store.transition('1', 'b', 1);
		await store.attachAssessment('1', 'f', {} as never);
		await store.archive('1');
		store.clear?.();
		expect(changed).toHaveBeenCalledTimes(6);
	});

	it('passes results through unchanged', async () => {
		const inner = fakeStore();
		const store = notifying(inner, () => {});
		expect(await store.create('x', { a: 1 })).toBe(ok);
		expect(inner.create).toHaveBeenCalledWith('x', { a: 1 });
	});
});
