import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { applyTransition } from '../../records/workflow.js';
import { definition, ELEMENTS, engine } from './engine.js';

function view(data: RecordData, state = 'entwurf') {
	return { state, data: validateRecord(definition, data).data };
}

const applicable: RecordData = {
	bezeichnung: 'Bonitätsprüfung',
	hochrisiko: 'true',
	betreiberart: 'kredit'
};
const filled: RecordData = {
	...applicable,
	...Object.fromEntries(ELEMENTS.map((e) => [e.id, 'beschrieben'])),
	grundrechte: ['diskriminierung'],
	dsfa: 'DSFA Kreditentscheidung 2026'
};

const assess = (data: RecordData) => engine.assess!(view(data))!;

describe('Grundrechte-Folgenabschätzung', () => {
	it('applies only to Annex III systems of the deployers named, without critical infrastructure', () => {
		expect(assess(applicable).outcome).toBe('unvollstaendig');
		expect(assess({ ...applicable, betreiberart: 'keine' }).outcome).toBe('nicht-erforderlich');
		expect(assess({ ...applicable, hochrisiko: 'false' }).outcome).toBe('nicht-erforderlich');
		expect(assess({ ...applicable, infrastruktur: 'true' }).explanation.de).toContain(
			'Anhang III Nr. 2'
		);
	});

	it('lists the missing elements of Art. 27(1)(a)–(f)', () => {
		expect(assess(applicable).reasons.map((r) => r.cite?.ref)).toEqual(ELEMENTS.map((e) => e.ref));
		expect(assess({ ...filled, aufsicht: '' }).reasons.map((r) => r.questionId)).toEqual([
			'aufsicht'
		]);
	});

	it('asks to notify once complete and closes when notified', () => {
		expect(assess(filled)).toMatchObject({ verdict: 'conditional', outcome: 'mitteilen' });
		expect(assess({ ...filled, mitgeteilt_am: '2026-10-14T08:00:00.000Z' }).outcome).toBe(
			'mitgeteilt'
		);
	});

	it('points to the DPIA and the rights concerned', () => {
		const notes = assess({ ...filled, dsfa: '', grundrechte: [] })
			.notes!.map((n) => n.de)
			.join('\n');
		expect(notes).toContain('Art. 27 Abs. 4');
		expect(notes).toContain('berührten Grundrechte');
	});

	it('makes first use the deadline until notified, and keeps the review date', () => {
		const data = { ...filled, erste_verwendung: '2027-12-02', ueberpruefung: '2028-12-01' };
		expect(engine.deadlines!(view(data)).map((d) => [d.kind, d.dueAt])).toEqual([
			['erste-verwendung', '2027-12-01T23:00:00.000Z'],
			['ueberpruefung', '2028-12-01T08:00:00.000Z']
		]);
		expect(engine.deadlines!(view(data, 'mitgeteilt')).map((d) => d.kind)).toEqual([
			'ueberpruefung'
		]);
	});

	it('documents "not required" only when the details say so', () => {
		expect(applyTransition(definition, view(applicable), 'nicht_erforderlich')).toMatchObject({
			error: 'blocked'
		});
		expect(
			applyTransition(
				definition,
				view({ ...applicable, betreiberart: 'keine' }),
				'nicht_erforderlich'
			)
		).toEqual({ ok: true, state: 'nicht_erforderlich' });
	});
});
