import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { CLAUSES, definition, engine, evidenceExpired, reviewOutdated } from './engine.js';

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
	it('covers Art. 28(3) sentence 1, letters a to h and the notice of unlawful instructions', () => {
		expect(CLAUSES.map((c) => c.cite?.ref.replace('Art. 28 Abs. 3 ', ''))).toEqual([
			'Satz 1',
			'lit. a',
			'lit. b',
			'lit. c',
			'lit. d',
			'lit. e',
			'lit. f',
			'lit. g',
			'lit. h',
			'UAbs. 2'
		]);
	});

	it('keeps the check open while clauses are unanswered', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
		expect(assess({ lit_a: 'true' }).headline.de).toBe('Prüfung offen: 9 von 10 Punkten.');
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

	it('dates a missing clause that has a date to be fixed by', () => {
		const record = view({
			...allYes,
			lit_c: 'nein',
			lit_c_frist: '2026-12-15',
			lit_c_notiz: 'Anlage TOM fehlt'
		});
		expect(engine.deadlines!(record).map((d) => d.kind)).toContain('luecke-lit_c');
		expect(engine.assess!(record)!.reasons.map((r) => r.questionId)).toContain('lit_c');
	});
});

describe('AVV-Prüfung: sub-processor chain and lifecycle', () => {
	beforeAll(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-24T12:00:00Z'));
	});
	afterAll(() => {
		vi.useRealTimers();
	});

	const signed = { ...allYes, status: 'freigegeben', genehmigung: 'keine' };

	it('needs the same obligations for sub-processors and their names', () => {
		const chain = { ...signed, genehmigung: 'einzeln' };
		expect(notes(chain)).toContain('Art. 28 Abs. 4');
		expect(notes(chain)).toContain('nicht benannt');
		const defect = assess({ ...chain, gleiche_pflichten: false });
		expect(defect.reasons.map((r) => r.cite?.ref)).toEqual(['Art. 28 Abs. 4']);
		expect(notes({ ...chain, gleiche_pflichten: false })).toContain('„Freigegeben“');
		expect(
			notes({ ...chain, gleiche_pflichten: true, unterauftragnehmer: 'Rechenzentrum, Frankfurt' })
		).toBe('');
	});

	it('falls due a year after the last check and when the evidence runs out', () => {
		expect(
			engine.deadlines!(
				view({ ...signed, geprueft_am: '2026-09-01', nachweis_bis: '2027-03-31' })
			).map((d) => [d.kind, d.dueAt])
		).toEqual([
			['wiedervorlage', '2027-09-01T07:00:00.000Z'],
			['nachweis', '2027-03-31T07:00:00.000Z']
		]);
		expect(reviewOutdated(view({ geprueft_am: '2025-11-01' }))).toBe(true);
		expect(evidenceExpired(view({ nachweis_bis: '2026-11-23' }))).toBe(true);
		expect(evidenceExpired(view({ nachweis_bis: '2026-11-24' }))).toBe(false);
		const old = notes({
			...signed,
			garantien: 'zertifikat',
			geprueft_am: '2025-11-01',
			nachweis_bis: '2026-06-30'
		});
		expect(old).toContain('zwölf Monate');
		expect(old).toContain('abgelaufen');
	});

	it('asks for the deletion confirmation once the contract has ended', () => {
		expect(notes({ ...signed, status: 'beendet' })).toContain('lit. g');
		expect(notes({ ...signed, status: 'beendet', loeschbestaetigung: true })).toBe('');
		expect(
			engine.deadlines!(view({ ...signed, status: 'beendet', geprueft_am: '2026-09-01' }))
		).toEqual([]);
	});

	it('carries the third-country check into the result once attached', () => {
		const abroad = { ...signed, sitz: 'drittland' };
		expect(notes(abroad)).toContain('die Drittlandprüfung im Eintrag');
		const checked: RecordData = {
			...abroad,
			transfer_check: {
				tool: 'drittland-transfer',
				catalogVersion: 1,
				verdict: 'negative' as const,
				headline: { de: 'Übermittlung zulässig.', en: 'Transfer permitted.' },
				at: '2026-11-01T08:00:00.000Z'
			}
		};
		expect(notes(checked)).toContain('Drittlandprüfung: Übermittlung zulässig.');
	});
});
