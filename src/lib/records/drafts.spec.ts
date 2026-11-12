import { describe, expect, it } from 'vitest';
import { clearDraft, clearDrafts, draftKey, loadDraft, saveDraft } from './drafts.js';

function memory() {
	const items = new Map<string, string>();
	return {
		items,
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value),
		removeItem: (key: string) => void items.delete(key),
		key: (i: number) => [...items.keys()][i] ?? null,
		get length() {
			return items.size;
		}
	};
}

describe('drafts', () => {
	it('keeps values with the time of the change and the version they started from', () => {
		const storage = memory();
		const now = new Date('2026-11-12T13:05:00.000Z');
		saveDraft(draftKey.record('vvt', 'abc'), { bezeichnung: 'Lohn' }, 3, storage, now);
		expect(loadDraft(draftKey.record('vvt', 'abc'), storage)).toEqual({
			values: { bezeichnung: 'Lohn' },
			savedAt: '2026-11-12T13:05:00.000Z',
			version: 3
		});
		expect(loadDraft(draftKey.newRecord('vvt'), storage)).toBeNull();
	});

	it('separates questionnaires by the entry they answer for', () => {
		expect(draftKey.check('dsfa-schwellwert')).toBe('check:dsfa-schwellwert');
		expect(draftKey.check('dsfa-schwellwert', 'vvt:1:dsfa')).toBe(
			'check:dsfa-schwellwert:vvt:1:dsfa'
		);
	});

	it('ignores broken entries and survives blocked storage', () => {
		const storage = memory();
		storage.setItem('daily.draft.v1:check:x', '{not json');
		expect(loadDraft('check:x', storage)).toBeNull();
		const blocked = {
			...memory(),
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		};
		expect(() => saveDraft('check:x', {}, undefined, blocked)).not.toThrow();
		expect(loadDraft('check:x', null)).toBeNull();
	});

	it('clears one draft or all, and leaves other keys alone', () => {
		const storage = memory();
		saveDraft('a', 1, undefined, storage);
		saveDraft('b', 2, undefined, storage);
		storage.setItem('daily.tools.pinned.v1', '[]');
		clearDraft('a', storage);
		expect(loadDraft('a', storage)).toBeNull();
		expect(loadDraft('b', storage)).not.toBeNull();
		clearDrafts(storage);
		expect([...storage.items.keys()]).toEqual(['daily.tools.pinned.v1']);
	});
});
