import { describe, expect, it } from 'vitest';
import { testDefinition as def } from './fixtures.js';
import { applyListQuery, readListQuery, sortKeys, writeListQuery } from './listing.js';
import type { StoredRecord } from './types.js';

function record(id: string, overrides: Partial<StoredRecord> = {}): StoredRecord {
	return {
		id,
		toolSlug: def.slug,
		definitionVersion: 1,
		state: 'open',
		title: id,
		data: { name: id },
		version: 1,
		createdAt: '2026-10-01T08:00:00.000Z',
		updatedAt: '2026-10-01T08:00:00.000Z',
		archivedAt: null,
		...overrides
	};
}

const records = [
	record('Zeiterfassung', {
		state: 'review',
		data: { name: 'Zeiterfassung', kind: 'b' },
		updatedAt: '2026-10-03T08:00:00.000Z'
	}),
	record('Äpfel', { data: { name: 'Äpfel', kind: 'a' }, updatedAt: '2026-10-05T08:00:00.000Z' }),
	record('Bewerbung 10', { data: { name: 'Bewerbung 10' }, updatedAt: '2026-10-04T08:00:00.000Z' }),
	record('Bewerbung 9', { data: { name: 'Bewerbung 9' }, updatedAt: '2026-10-02T08:00:00.000Z' })
];
const titles = (list: StoredRecord[]) => list.map((r) => r.title);
const run = (search: string) =>
	titles(applyListQuery(def, records, readListQuery(new URLSearchParams(search)), 'de'));

describe('register list query', () => {
	it('shows the newest change first by default', () => {
		expect(run('')).toEqual(['Äpfel', 'Bewerbung 10', 'Zeiterfassung', 'Bewerbung 9']);
	});

	it('searches title and list columns, ignoring case', () => {
		expect(run('suche=bewerb')).toEqual(['Bewerbung 10', 'Bewerbung 9']);
		expect(run('suche=%20B%20')).toEqual(['Bewerbung 10', 'Zeiterfassung', 'Bewerbung 9']);
	});

	it('filters by workflow state', () => {
		expect(run('status=review')).toEqual(['Zeiterfassung']);
	});

	it('sorts German titles naturally, both ways', () => {
		expect(run('sortierung=title')).toEqual([
			'Äpfel',
			'Bewerbung 9',
			'Bewerbung 10',
			'Zeiterfassung'
		]);
		expect(run('sortierung=-title')).toEqual([
			'Zeiterfassung',
			'Bewerbung 10',
			'Bewerbung 9',
			'Äpfel'
		]);
	});

	it('sorts by a list column and falls back to the last change for unknown keys', () => {
		expect(run('sortierung=kind')).toEqual([
			'Bewerbung 10',
			'Bewerbung 9',
			'Äpfel',
			'Zeiterfassung'
		]);
		expect(run('sortierung=notes')).toEqual(run(''));
		expect(sortKeys(def)).toEqual(['title', 'kind', 'state', 'updated']);
	});

	it('writes only what differs from the defaults', () => {
		const query = readListQuery(new URLSearchParams('eintrag=x'));
		expect(writeListQuery(new URLSearchParams('archiviert=1'), query).toString()).toBe(
			'archiviert=1'
		);
		expect(
			writeListQuery(new URLSearchParams(), {
				...query,
				search: 'a b',
				sort: 'title',
				descending: false
			}).toString()
		).toBe('suche=a+b&sortierung=title');
	});
});
