import { describe, expect, it } from 'vitest';
import type { Deadline, StoredRecord } from '../records/types.js';
import { definition } from '../tools/betroffenenanfrage/definition.js';
import { dueNow, openCases, sortCases } from './today.js';

const now = new Date('2026-11-13T09:00:00Z');
const deadline = (recordId: string, dueAt: string): Deadline =>
	({
		recordId,
		dueAt,
		kind: 'k',
		toolSlug: 't',
		recordTitle: recordId,
		label: { de: '', en: '' }
	}) as Deadline;
const record = (id: string, state: string, updatedAt = '2026-11-01T00:00:00Z'): StoredRecord =>
	({ id, state, updatedAt, archivedAt: null, title: id, data: {} }) as StoredRecord;

describe('Heute', () => {
	it('splits deadlines into overdue, due this week and later', () => {
		const out = dueNow(
			[
				deadline('c', '2026-12-24T09:00:00Z'),
				deadline('b', '2026-11-15T09:00:00Z'),
				deadline('a', '2026-11-10T09:00:00Z')
			],
			now
		);
		expect(out.overdue.map((d) => d.recordId)).toEqual(['a']);
		expect(out.soon.map((d) => d.recordId)).toEqual(['b']);
		expect(out.later).toBe(1);
	});

	it('counts a case as open until its last state or the archive', () => {
		const states = definition.workflow!.states;
		const last = states.find((s) => s.terminal)!.id;
		const records = [
			record('open', states[0].id),
			record('done', last),
			{ ...record('gone', states[0].id), archivedAt: '2026-11-02T00:00:00Z' }
		];
		expect(openCases(definition, records).map((r) => r.id)).toEqual(['open']);
	});

	it('puts the case with the nearest deadline first, then the newest', () => {
		const cases = sortCases(
			[record('old', 's', '2026-10-01T00:00:00Z'), record('new', 's'), record('due', 's')],
			[deadline('due', '2026-11-20T09:00:00Z'), deadline('due', '2026-11-14T09:00:00Z')]
		);
		expect(cases.map((c) => c.record.id)).toEqual(['due', 'new', 'old']);
		expect(cases[0].due).toBe('2026-11-14T09:00:00Z');
	});
});
