import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import type { QuestionnaireResult } from '../types.js';
import { definition, engine, reviewOutdated } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const complete: RecordData = {
	bezeichnung: 'Newsletter',
	rolle: 'verantwortlicher',
	zwecke: 'Versand von Produktinformationen',
	rechtsgrundlagen: ['einwilligung'],
	betroffene: ['kunden'],
	datenkategorien: ['kontakt', 'nutzung'],
	empfaenger: ['intern'],
	loeschfristen: 'Bis zum Widerruf',
	tom: 'Siehe TOM-Konzept',
	dsfa: 'nicht_erforderlich',
	status: 'aktiv'
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('VVT', () => {
	it('requires name, role, purposes, data subjects, data categories and status', () => {
		expect(Object.keys(validateRecord(definition, {}).errors).sort()).toEqual(
			['bezeichnung', 'betroffene', 'datenkategorien', 'rolle', 'status', 'zwecke'].sort()
		);
	});

	it('calls a complete controller entry complete', () => {
		expect(assess(complete)).toMatchObject({ verdict: 'negative', outcome: 'vollstaendig' });
	});

	it('lists missing Art. 30(1) items with their letter', () => {
		const result = assess({ ...complete, loeschfristen: '', tom: '', empfaenger: [] });
		expect(result.outcome).toBe('unvollstaendig');
		expect(result.reasons.map((r) => r.cite?.ref)).toEqual([
			'Art. 30 Abs. 1 lit. d',
			'Art. 30 Abs. 1 lit. f',
			'Art. 30 Abs. 1 lit. g'
		]);
		expect(result.explanation.de).toContain('3 Angaben');
	});

	it('checks Art. 30(2) for processors and Art. 26 for joint controllers', () => {
		const processor = assess({ ...complete, rolle: 'auftragsverarbeiter', loeschfristen: '' });
		expect(processor.reasons.map((r) => r.questionId)).toEqual(['auftraggeber']);
		const joint = assess({ ...complete, rolle: 'gemeinsam' });
		expect(joint.reasons.map((r) => r.questionId)).toEqual(['gemeinsam_mit']);
	});

	it('requires transfer details and flags a missing transfer basis', () => {
		const result = assess({ ...complete, drittland: 'true' });
		expect(result.reasons.map((r) => r.questionId)).toEqual(['drittland_details']);
		expect(notes({ ...complete, drittland: 'true', drittland_details: 'USA, Hosting' })).toContain(
			'Art. 45 bis 49'
		);
		expect(
			assess({ ...complete, drittland: 'true', drittland_details: 'USA', garantien: ['scc'] })
				.verdict
		).toBe('negative');
	});

	it('raises legal points about bases, consent and the DSFA', () => {
		expect(notes({ ...complete, datenkategorien: ['art9'] })).toContain('Art. 9 Abs. 2');
		expect(notes({ ...complete, rechtsgrundlagen: ['beschaeftigung'] })).toContain('C-34/21');
		expect(notes({ ...complete, betroffene: ['beschaeftigte'] })).toContain('§ 26 Abs. 2 BDSG');
		expect(notes({ ...complete, dsfa: 'erforderlich' })).toContain('Art. 35 Abs. 1');
		expect(notes({ ...complete, dsfa: '' })).toContain('DSFA-Schwellwertanalyse');
		expect(notes({ ...complete, empfaenger: ['auftragsverarbeiter'] })).toContain('Art. 28 Abs. 3');
		expect(assess({ ...complete, dsfa: 'erforderlich' }).outcome).toBe('offene-punkte');
	});

	it('takes the DSFA decision from the screening without undoing a finished DSFA', () => {
		const result = (verdict: QuestionnaireResult['verdict']) =>
			({ verdict, headline: { de: '', en: '' } }) as QuestionnaireResult;
		expect(engine.fromAssessment!('dsfa_check', result('positive'), view({}))).toEqual({
			dsfa: 'erforderlich'
		});
		expect(
			engine.fromAssessment!('dsfa_check', result('positive'), view({ dsfa: 'durchgefuehrt' }))
		).toEqual({});
		expect(engine.fromAssessment!('dsfa_check', result('negative'), view({}))).toEqual({
			dsfa: 'nicht_erforderlich'
		});
		expect(engine.fromAssessment!('dsfa_check', result('conditional'), view({}))).toEqual({});
		expect(engine.fromAssessment!('transfer_check', result('positive'), view({}))).toEqual({});
	});

	it('sets the review date unless the activity is discontinued', () => {
		expect(engine.deadlines!(view({ wiedervorlage: '2027-01-11', status: 'aktiv' }))).toEqual([
			expect.objectContaining({ dueAt: '2027-01-11T08:00:00.000Z' })
		]);
		expect(engine.deadlines!(view({ wiedervorlage: '2027-01-11', status: 'eingestellt' }))).toEqual(
			[]
		);
	});
});

describe('VVT: lawfulness and review', () => {
	beforeAll(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
	});
	afterAll(() => {
		vi.useRealTimers();
	});

	it('asks for a legal basis, the interests and the provision behind an obligation', () => {
		expect(notes({ ...complete, rechtsgrundlagen: [] })).toContain('Keine Rechtsgrundlage');
		expect(notes({ ...complete, rechtsgrundlagen: ['interesse'] })).toContain(
			'Berechtigte Interessen ohne Angabe'
		);
		expect(
			notes({ ...complete, rechtsgrundlagen: ['interesse'], interessen: 'Direktwerbung' })
		).not.toContain('Berechtigte Interessen ohne Angabe');
		expect(notes({ ...complete, rechtsgrundlagen: ['pflicht'] })).toContain('Art. 6 Abs. 3');
		expect(
			notes({ ...complete, rechtsgrundlagen: ['pflicht'], rechtsgrundlagen_details: '§ 147 AO' })
		).toBe('');
	});

	it('needs an Art. 10 basis for criminal offence data, apart from Art. 9', () => {
		const crime = { ...complete, datenkategorien: ['art10'] };
		expect(notes(crime)).toContain('Art. 10');
		expect(notes({ ...crime, rechtsgrundlagen: ['einwilligung', 'art10'] })).toBe('');
	});

	it('flags consent of minors, Art. 49 for regular transfers and profiling without a DPIA', () => {
		expect(notes({ ...complete, betroffene: ['minderjaehrige'] })).toContain('Art. 8 Abs. 1');
		expect(
			notes({
				...complete,
				drittland: true,
				drittland_details: 'USA',
				garantien: ['ausnahme']
			})
		).toContain('nur gelegentliche');
		expect(notes({ ...complete, automatisiert: true })).toContain('Art. 35 Abs. 3 lit. a');
	});

	it('leaves a processor without the controller checks', () => {
		const processor = {
			...complete,
			rolle: 'auftragsverarbeiter',
			auftraggeber: 'Muster AG',
			rechtsgrundlagen: []
		};
		expect(notes(processor)).toBe('');
	});

	it('falls due a year after the last review and flags an old one', () => {
		expect(engine.deadlines!(view({ geprueft_am: '2026-03-01', status: 'aktiv' }))).toEqual([
			expect.objectContaining({ dueAt: '2027-03-01T08:00:00.000Z' })
		]);
		expect(reviewOutdated(view({ geprueft_am: '2025-11-01' }))).toBe(true);
		expect(notes({ ...complete, geprueft_am: '2025-11-01' })).toContain('zwölf Monate');
		expect(notes({ ...complete, geprueft_am: '2025-11-01', status: 'eingestellt' })).toBe('');
	});
});
