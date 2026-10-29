import { describe, expect, it } from 'vitest';
import { referenceFields } from '../../records/links.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { allowedTransitions } from '../../records/workflow.js';
import { getQuestionnaire } from '../registry.js';
import type { Answers } from '../types.js';
import { definition, engine, RISKS, riskLevel } from './engine.js';

function view(data: RecordData, state = 'entwurf') {
	return { state, data: validateRecord(definition, data).data };
}

/** every risk rated 3/3 (high) before and 2/2 (low) after measures */
const rated: RecordData = Object.fromEntries(
	RISKS.flatMap(({ id }) => [
		[`${id}_w`, '3'],
		[`${id}_s`, '3'],
		[`${id}_massnahmen`, 'Maßnahmen'],
		[`${id}_rw`, '2'],
		[`${id}_rs`, '2']
	])
);
const complete: RecordData = {
	bezeichnung: 'Videoüberwachung Lager',
	verarbeitung: 'Kameras im Lager, Speicherung 72 Stunden',
	zwecke: 'Schutz vor Diebstahl',
	notwendigkeit: 'Mildere Mittel geprüft',
	dsb: 'Zustimmung mit Auflagen',
	schwellwert: {
		tool: 'dsfa-schwellwert',
		catalogVersion: 1,
		verdict: 'positive',
		headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' },
		at: '2026-10-01T08:00:00.000Z'
	},
	ueberpruefung: '2027-10-01',
	...rated
};

const assess = (data: RecordData) => engine.assess!(view(data))!;

describe('DSFA: risk matrix', () => {
	it('rates likelihood plus severity: up to 4 low, 5–6 risk, from 7 high', () => {
		expect(riskLevel(1, 3)).toBe('gering');
		expect(riskLevel(2, 3)).toBe('risiko');
		expect(riskLevel(3, 3)).toBe('risiko');
		expect(riskLevel(3, 4)).toBe('hoch');
		expect(riskLevel(4, 4)).toBe('hoch');
	});
});

describe('DSFA: assessment', () => {
	it('accepts a complete DPIA whose residual risks are not high', () => {
		const result = assess(complete);
		expect(result).toMatchObject({ verdict: 'negative', outcome: 'vertretbar' });
		expect(result.notes![0].de).toBe(
			'Unbefugte Offenlegung: Risiko → nach Maßnahmen geringes Risiko.'
		);
	});

	it('requires consultation for a high residual risk', () => {
		const result = assess({ ...complete, vertraulichkeit_rw: '4', vertraulichkeit_rs: '4' });
		expect(result.outcome).toBe('konsultation');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['vertraulichkeit']);
	});

	it('treats an unrated residual as the initial rating', () => {
		const result = assess({
			...complete,
			rechte_w: '4',
			rechte_s: '4',
			rechte_rw: '',
			rechte_rs: ''
		});
		expect(result.reasons.map((r) => r.questionId)).toEqual(['rechte']);
	});

	it('names what Art. 35(7) still lacks', () => {
		const result = assess({ bezeichnung: 'X', ...rated, zweck_massnahmen: '' });
		expect(result.outcome).toBe('unvollstaendig');
		expect(result.explanation.de).toBe(
			'Nach Art. 35 Abs. 7 fehlen noch: Beschreibung und Zwecke (lit. a), Notwendigkeit und Verhältnismäßigkeit (lit. b), Abhilfemaßnahmen (lit. d).'
		);
		const notes = result.notes!.map((n) => n.de).join('\n');
		expect(notes).toContain('Art. 35 Abs. 2');
		expect(notes).toContain('Schwellwertanalyse');
		expect(notes).toContain('Art. 35 Abs. 11');
	});
});

describe('DSFA: workflow and deadlines', () => {
	const options = (data: RecordData, state: string) =>
		Object.fromEntries(
			allowedTransitions(definition, view(data, state)).map((o) => [
				o.transition.to,
				o.missing.length === 0 && o.blocked === null
			])
		);

	it('completes the assessment only once every risk is rated', () => {
		expect(options({ ...complete, zweck_w: '' }, 'entwurf')).toEqual({ bewertet: false });
		expect(options(complete, 'entwurf')).toEqual({ bewertet: true });
	});

	it('signs off directly or after consultation depending on the residual risk', () => {
		const ok = {
			...complete,
			entscheidung: 'Freigegeben',
			konsultation_am: '2026-10-14T08:00:00.000Z'
		};
		expect(options(ok, 'bewertet')).toEqual({
			entwurf: true,
			konsultation: false,
			abgeschlossen: true
		});
		const high = { ...ok, vertraulichkeit_rw: '4', vertraulichkeit_rs: '4' };
		expect(options(high, 'bewertet')).toEqual({
			entwurf: true,
			konsultation: true,
			abgeschlossen: false
		});
	});

	it('expects the authority’s opinion within eight weeks and keeps the review date', () => {
		const consulting = view(
			{ ...complete, konsultation_am: '2026-10-14T08:00:00.000Z' },
			'konsultation'
		);
		expect(engine.deadlines!(consulting).map((d) => [d.kind, d.dueAt])).toEqual([
			['stellungnahme', '2026-12-09T08:00:00.000Z'],
			['ueberpruefung', '2027-10-01T07:00:00.000Z']
		]);
	});
});

describe('DSFA: links and screening handoff', () => {
	const screening = getQuestionnaire('dsfa-schwellwert')!;
	const answersWith = (yes: string[]): Answers =>
		Object.fromEntries(
			screening.catalog.sections
				.flatMap((section) => section.questions)
				.map((question) => [question.id, yes.includes(question.id) ? 'yes' : 'no'])
		);
	const twoCriteria = screening.catalog.sections
		.flatMap((section) => section.questions)
		.slice(-2)
		.map((question) => question.id);

	it('links the DSFA to its processing activity', () => {
		expect(definition.version).toBe(2);
		expect(referenceFields(definition).map((f) => [f.id, f.tool])).toEqual([['vvt', 'vvt']]);
	});

	it('takes the screening reasons over as the reason for the DPIA', () => {
		const result = screening.engine(screening.catalog, answersWith(twoCriteria));
		expect(result.verdict).toBe('positive');
		const derived = engine.fromAssessment!('schwellwert', result, view({ bezeichnung: 'X' }));
		const lines = String(derived.anlass).split('\n');
		expect(lines).toHaveLength(result.reasons.length);
		expect(lines.every((line) => line.startsWith('– '))).toBe(true);
		expect(validateRecord(definition, { bezeichnung: 'X', ...derived }).errors).toEqual({});
	});

	it('keeps text the user wrote and ignores other fields or empty results', () => {
		const result = screening.engine(screening.catalog, answersWith(twoCriteria));
		expect(
			engine.fromAssessment!('schwellwert', result, view({ bezeichnung: 'X', anlass: 'Eigener' }))
		).toEqual({});
		expect(engine.fromAssessment!('other', result, view({ bezeichnung: 'X' }))).toEqual({});
		const none = screening.engine(screening.catalog, answersWith([]));
		expect(engine.fromAssessment!('schwellwert', none, view({ bezeichnung: 'X' }))).toEqual({});
	});
});
