import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const clerks: RecordData = {
	rolle: 'Sachbearbeitung Personal',
	nutzung: 'anwendung',
	inhalte: ['risiken', 'daten', 'richtlinie'],
	form: 'schulung',
	status: 'durchgefuehrt',
	durchgefuehrt_am: '2026-10-01',
	nachweis: 'system',
	wiederholung_monate: '12'
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('KI-Kompetenz', () => {
	it('accepts a role whose essential content is covered and evidenced', () => {
		expect(assess(clerks)).toMatchObject({ verdict: 'negative', outcome: 'durchgefuehrt' });
	});

	it('treats missing oversight content as a defect under Art. 26(2)', () => {
		const result = assess({ ...clerks, nutzung: 'aufsicht' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['aufsicht', 'funktionsweise']);
		expect(result.reasons[0].cite?.ref).toBe('Art. 26 Abs. 2');
	});

	it('names missing content as a point for other roles', () => {
		expect(notes({ ...clerks, nutzung: 'entwicklung' })).toContain(
			'Funktionsweise und Grenzen, KI-Verordnung und DSGVO'
		);
	});

	it('keeps planned measures open and without deadline', () => {
		expect(assess({ ...clerks, status: 'geplant' }).outcome).toBe('geplant');
		expect(engine.deadlines!(view({ ...clerks, status: 'geplant' }))).toEqual([]);
	});

	it('derives the refresher deadline and asks for evidence and an interval', () => {
		expect(engine.deadlines!(view(clerks))).toEqual([
			expect.objectContaining({ kind: 'auffrischung', dueAt: '2027-10-01T07:00:00.000Z' })
		]);
		expect(notes({ ...clerks, nachweis: 'keiner' })).toContain('nicht belegt');
		expect(notes({ ...clerks, wiederholung_monate: '' })).toContain('12 Monate');
		expect(notes({ ...clerks, vorkenntnisse: 'keine', form: 'anleitung' })).toContain(
			'Praxisfällen'
		);
	});
});
