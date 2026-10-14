import { describe, expect, it } from 'vitest';
import { toCsv } from './csv.js';
import { addHours, addMonths, computeDeadlines } from './deadlines.js';
import { testDefinition as def } from './fixtures.js';
import { formatValue } from './format.js';
import { toIcs } from './ics.js';
import type { Deadline, RecordTool, StoredRecord } from './types.js';
import { allFields } from './validate.js';
import { allowedTransitions, applyTransition, initialState, isTerminal } from './workflow.js';

function record(overrides: Partial<StoredRecord> = {}): StoredRecord {
	return {
		id: 'r1',
		toolSlug: def.slug,
		definitionVersion: 1,
		state: 'open',
		title: 'Eins',
		data: { name: 'Eins', kind: null, due: null },
		version: 1,
		createdAt: '2026-10-14T08:00:00.000Z',
		updatedAt: '2026-10-14T08:00:00.000Z',
		archivedAt: null,
		...overrides
	};
}

describe('workflow', () => {
	it('starts in the initial state and knows terminal states', () => {
		expect(initialState(def)).toBe('open');
		expect(isTerminal(def, 'done')).toBe(true);
		expect(isTerminal(def, 'open')).toBe(false);
	});

	it('lists transitions out of the current state with missing fields', () => {
		const options = allowedTransitions(def, record());
		expect(options).toHaveLength(1);
		expect(options[0].transition.to).toBe('review');
		expect(options[0].missing).toEqual(['kind']);
	});

	it('refuses transitions that are not offered or lack required fields', () => {
		expect(applyTransition(def, record(), 'done')).toEqual({ ok: false, error: 'not-allowed' });
		expect(applyTransition(def, record(), 'review')).toEqual({
			ok: false,
			error: 'missing',
			missing: ['kind']
		});
	});

	it('applies the transition check after the required fields', () => {
		const reason = { de: 'Erst B wählen', en: 'Choose B first' };
		const guarded = {
			...def,
			workflow: {
				...def.workflow!,
				transitions: def.workflow!.transitions.map((t) =>
					t.to === 'review'
						? {
								...t,
								check: (r: { data: Record<string, unknown> }) =>
									r.data.kind === 'b' ? null : reason
							}
						: t
				)
			}
		};
		const a = record({ data: { name: 'Eins', kind: 'a' } });
		expect(allowedTransitions(guarded, a)[0].blocked).toEqual(reason);
		expect(applyTransition(guarded, a, 'review')).toEqual({ ok: false, error: 'blocked', reason });
		const b = record({ data: { name: 'Eins', kind: 'b' } });
		expect(applyTransition(guarded, b, 'review')).toEqual({ ok: true, state: 'review' });
	});

	it('allows a transition once its fields are filled', () => {
		const filled = record({ data: { name: 'Eins', kind: 'a' } });
		expect(applyTransition(def, filled, 'review')).toEqual({ ok: true, state: 'review' });
	});
});

describe('deadline maths', () => {
	it('adds 72 hours in absolute time across the end of daylight saving', () => {
		// 24 Oct 2026, 10:00 in Berlin (CEST); DST ends on 25 Oct.
		expect(addHours('2026-10-24T08:00:00.000Z', 72)).toBe('2026-10-27T08:00:00.000Z');
	});

	it('adds calendar months and clamps to the end of shorter months', () => {
		expect(addMonths('2026-10-14T09:00:00.000Z', 1)).toBe('2026-11-14T09:00:00.000Z');
		expect(addMonths('2026-01-31T09:00:00.000Z', 1)).toBe('2026-02-28T09:00:00.000Z');
		expect(addMonths('2026-12-31T09:00:00.000Z', 2)).toBe('2027-02-28T09:00:00.000Z');
	});

	it('takes deadlines from the engine and drops them in terminal states', () => {
		const tool: RecordTool = {
			manifest: {} as RecordTool['manifest'],
			definition: def,
			engine: {
				deadlines: () => [
					{ kind: 'b', label: { de: 'B', en: 'B' }, dueAt: '2026-10-20T00:00:00.000Z' },
					{ kind: 'a', label: { de: 'A', en: 'A' }, dueAt: '2026-10-15T00:00:00.000Z' }
				]
			}
		};
		const open = computeDeadlines(tool, record());
		expect(open.map((d) => d.kind)).toEqual(['a', 'b']);
		expect(open[0]).toMatchObject({ recordId: 'r1', recordTitle: 'Eins' });
		expect(computeDeadlines(tool, record({ state: 'done' }))).toEqual([]);
		expect(computeDeadlines(tool, record({ archivedAt: '2026-10-14T09:00:00.000Z' }))).toEqual([]);
	});
});

describe('export', () => {
	const fields = allFields(def);
	const field = (id: string) => fields.find((f) => f.id === id)!;

	it('formats values for people', () => {
		expect(formatValue(field('kind'), 'b', 'de')).toBe('B');
		expect(formatValue(field('tags'), ['x', 'z'], 'en')).toBe('X, Z');
		expect(formatValue(field('flag'), false, 'de')).toBe('Nein');
		expect(formatValue(field('due'), '2026-10-25', 'de')).toBe('25.10.2026');
		expect(formatValue(field('seen'), '2026-10-12T22:30:00.000Z', 'de')).toBe('13.10.2026 00:30');
		expect(formatValue(field('count'), 1200, 'de')).toBe('1.200');
	});

	it('writes German Excel CSV with BOM, semicolons and quoting', () => {
		const csv = toCsv(
			def,
			[record({ data: { name: 'Eins; zwei', notes: 'Zeile 1\nZeile 2', kind: 'a' } })],
			'de'
		);
		expect(csv.startsWith('﻿Status;Name;Notizen;Art')).toBe(true);
		const row = csv.split('\r\n')[1];
		expect(row.startsWith('Offen;"Eins; zwei";"Zeile 1\nZeile 2";A;')).toBe(true);
	});

	it('writes an iCalendar file with stable UIDs and a reminder', () => {
		const deadline: Deadline = {
			kind: 'meldung',
			label: { de: 'Meldung an die Aufsicht', en: 'Notify the authority' },
			dueAt: '2026-10-27T08:00:00.000Z',
			cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1' },
			recordId: 'r1',
			toolSlug: 'datenpanne',
			recordTitle: 'Fehlversand, Kundenliste'
		};
		const ics = toIcs([deadline], 'de', new Date('2026-10-24T08:00:00.000Z'));
		expect(ics).toContain('UID:r1-meldung@dai-ly.de');
		expect(ics).toContain('DTEND:20261027T080000Z');
		expect(ics).toContain('SUMMARY:Meldung an die Aufsicht – Fehlversand\\, Kundenliste');
		expect(ics).toContain('TRIGGER:-PT24H');
		expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(
			true
		);
	});
});
