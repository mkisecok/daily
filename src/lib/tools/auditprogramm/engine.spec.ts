import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { applyTransition } from '../../records/workflow.js';
import { definition, engine } from './engine.js';

function view(data: RecordData, state = 'geplant') {
	return { state, data: validateRecord(definition, data).data };
}
const audit: RecordData = {
	titel: 'Datenschutzaudit Personal',
	art: 'datenschutz',
	gegenstand: 'Personalverwaltung',
	kriterien: ['dsgvo', 'bdsg'],
	auditoren: 'Externe DSB',
	unabhaengig: 'true',
	risiko: 'Beschäftigtendaten, hohe Menge',
	methoden: ['dokumente', 'interviews'],
	geplant_am: '2026-11-10'
};
const assess = (data: RecordData, state?: string) => engine.assess!(view(data, state))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Auditprogramm', () => {
	it('requires scope, criteria and independent auditors', () => {
		const result = assess({ titel: 'X', geplant_am: '2026-11-10', unabhaengig: 'false' });
		expect(result.outcome).toBe('unvollstaendig');
		expect(result.reasons.map((r) => r.questionId)).toEqual([
			'gegenstand',
			'kriterien',
			'unabhaengig'
		]);
	});

	it('is planned, then conducted, and points to the checklist and processor audits', () => {
		expect(assess(audit).outcome).toBe('geplant');
		expect(assess(audit, 'durchgefuehrt').outcome).toBe('durchgefuehrt');
		expect(notes(audit)).toContain('DSGVO, BDSG');
		expect(notes({ ...audit, art: 'dienstleister' })).toContain('Art. 28 Abs. 3 lit. h');
	});

	it('turns the audit date, the report and the next audit into deadlines', () => {
		expect(engine.deadlines!(view(audit)).map((d) => [d.kind, d.dueAt])).toEqual([
			['audit', '2026-11-10T08:00:00.000Z']
		]);
		const done = view(
			{ ...audit, durchgefuehrt_am: '2026-11-10', naechstes_audit: '2027-11-01' },
			'durchgefuehrt'
		);
		expect(engine.deadlines!(done).map((d) => [d.kind, d.dueAt])).toEqual([
			['bericht', '2026-12-10T08:00:00.000Z'],
			['naechstes', '2027-11-01T08:00:00.000Z']
		]);
	});

	it('moves to preparation only with scope, criteria and auditors', () => {
		expect(
			applyTransition(definition, view({ titel: 'X', geplant_am: '2026-11-10' }), 'vorbereitung')
		).toMatchObject({ missing: ['gegenstand', 'kriterien', 'auditoren'] });
		expect(applyTransition(definition, view(audit), 'vorbereitung')).toEqual({
			ok: true,
			state: 'vorbereitung'
		});
	});
});
