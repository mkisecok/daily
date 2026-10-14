import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { CLAUSES, definition, engine } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const allYes = Object.fromEntries(CLAUSES.map((c) => [c.id, 'true']));
const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('AVV-Prüfung', () => {
	it('covers Art. 28(3) sentence 1 and letters a to h', () => {
		expect(CLAUSES.map((c) => c.cite?.ref.replace('Art. 28 Abs. 3 ', ''))).toEqual([
			'Satz 1',
			'lit. a',
			'lit. b',
			'lit. c',
			'lit. d',
			'lit. e',
			'lit. f',
			'lit. g',
			'lit. h'
		]);
	});

	it('keeps the check open while clauses are unanswered', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
		expect(assess({ lit_a: 'true' }).headline.de).toBe('Prüfung offen: 8 von 9 Punkten.');
	});

	it('lists clauses answered "no" as defects with their letter', () => {
		const result = assess({ ...allYes, lit_g: 'false', lit_h: 'false' });
		expect(result.outcome).toBe('maengel');
		expect(result.reasons.map((r) => r.cite?.ref)).toEqual([
			'Art. 28 Abs. 3 lit. g',
			'Art. 28 Abs. 3 lit. h'
		]);
	});

	it('requires the right to object with a general authorisation', () => {
		const result = assess({ ...allYes, genehmigung: 'allgemein' });
		expect(result.reasons.map((r) => r.questionId)).toEqual(['einspruch']);
		expect(assess({ ...allYes, genehmigung: 'allgemein', einspruch: 'true' }).outcome).toBe(
			'erfuellt'
		);
	});

	it('raises guarantees, transfers, special categories, breach reporting and the SCC', () => {
		expect(notes({ ...allYes, garantien: 'selbstauskunft' })).toContain('Art. 28 Abs. 1');
		expect(notes({ ...allYes, sitz: 'drittland' })).toContain('Art. 44');
		expect(notes({ ...allYes, besondere_kategorien: 'true' })).toContain('höheren Risiko');
		expect(notes({ ...allYes, meldung_pannen: 'false' })).toContain('Art. 33 Abs. 2');
		expect(notes({ ...allYes, vertragsart: 'scc' })).toContain('2021/915');
	});

	it('sets the review date unless the contract has ended', () => {
		expect(engine.deadlines!(view({ wiedervorlage: '2027-03-01', status: 'freigegeben' }))).toEqual(
			[expect.objectContaining({ dueAt: '2027-03-01T08:00:00.000Z' })]
		);
		expect(engine.deadlines!(view({ wiedervorlage: '2027-03-01', status: 'beendet' }))).toEqual([]);
	});
});
