import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const belege: RecordData = {
	datenart: 'Buchungsbelege',
	grundlage: 'belege',
	frist_wert: '8',
	frist_einheit: 'jahre',
	fristbeginn: 'jahresende',
	loeschregel: 'Jährlicher Löschlauf im Januar',
	loeschart: 'automatisch',
	status: 'umgesetzt',
	naechster_loeschlauf: '2027-01-15'
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Löschkonzept', () => {
	it('accepts a rule that matches the statutory period and explains the year-end start', () => {
		expect(assess(belege).outcome).toBe('hinweise');
		expect(notes(belege)).toContain('Unterlagen aus 2026 ab dem 1. Januar 2035');
	});

	it('treats a period shorter than the retention duty as a defect', () => {
		const result = assess({ ...belege, frist_wert: '6' });
		expect(result.outcome).toBe('maengel');
		expect(result.reasons[0].text.de).toBe(
			'Kürzer als die gesetzliche Aufbewahrungsfrist von 8 Jahren'
		);
	});

	it('asks for a reason when the period is longer than the statutory one', () => {
		expect(notes({ ...belege, frist_wert: '10' })).toContain('eigene Grundlage');
		expect(
			notes({ ...belege, frist_wert: '24', frist_einheit: 'monate', fristbeginn: 'ereignis' })
		).not.toContain('eigene Grundlage');
	});

	it('requires period, unit and start unless there is no statutory period', () => {
		const result = assess({
			datenart: 'X',
			grundlage: 'sonstige',
			loeschregel: 'r',
			status: 'entwurf'
		});
		expect(result.reasons.map((r) => r.questionId)).toEqual(['frist_wert', 'fristbeginn']);
		const none = assess({ datenart: 'X', grundlage: 'keine', loeschregel: 'r', status: 'entwurf' });
		expect(none.reasons).toEqual([]);
		expect(
			notes({ datenart: 'X', grundlage: 'keine', loeschregel: 'r', status: 'entwurf' })
		).toContain('Wegfall des Zwecks erkennbar');
	});

	it('explains restriction under § 35 BDSG and manual erasure', () => {
		expect(notes({ ...belege, loeschart: 'sperrung' })).toContain('§ 35 BDSG');
		expect(notes({ ...belege, loeschart: 'manuell' })).toContain('protokollieren');
		expect(notes({ ...belege, naechster_loeschlauf: '' })).toContain('nächsten Löschlauf');
	});

	it('turns the next erasure run into a deadline', () => {
		expect(engine.deadlines!(view(belege))).toEqual([
			expect.objectContaining({ kind: 'loeschlauf', dueAt: '2027-01-15T08:00:00.000Z' })
		]);
	});
});
