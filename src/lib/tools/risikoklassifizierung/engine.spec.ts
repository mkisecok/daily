import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { DATES, evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const allIds = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

/** everything "no" except the listed ids; `s_ai` defaults to yes */
function answers(yes: string[] = [], unknown: string[] = []): Answers {
	const base = Object.fromEntries(
		allIds.map((id) => [id, yes.includes(id) ? 'yes' : unknown.includes(id) ? 'unknown' : 'no'])
	) as Answers;
	if (!yes.includes('s_ai') && !unknown.includes('s_ai')) base.s_ai = 'yes';
	return base;
}

describe('Risikoklassifizierung engine', () => {
	it('catalog covers scope, nine prohibitions, Annex I, eight Annex III areas, exceptions, Art. 50', () => {
		expect(allIds).toHaveLength(2 + 9 + 9 + 5 + 4);
	});

	it('treats the Omnibus NCII/CSAM prohibition like the original eight', () => {
		const result = evaluate(catalog, answers(['p_ncii']));
		expect(result.verdict).toBe('positive');
		expect(result.explanation.en).toContain(DATES.prohibitedNcii.en);
	});

	it('is out of scope when it is not an AI system', () => {
		const result = evaluate(catalog, { ...answers(['h_employment']), s_ai: 'no' });
		expect(result.verdict).toBe('negative');
		expect(result.headline.de).toBe('Kein KI-System.');
	});

	it('is out of scope for excluded uses even if other answers are yes', () => {
		const result = evaluate(catalog, answers(['s_excluded', 'p_socialscoring']));
		expect(result.headline.en).toBe('Outside the scope.');
	});

	it('flags any Art. 5 practice as prohibited, before everything else', () => {
		const result = evaluate(catalog, answers(['p_emotionwork', 'h_employment', 't_interaction']));
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('Verbotene Praxis.');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['p_emotionwork']);
		expect(result.explanation.de).toContain(DATES.prohibited.de);
	});

	it('classifies Annex I products as high-risk with the 2028 date', () => {
		const result = evaluate(catalog, answers(['h_annex1']));
		expect(result.verdict).toBe('positive');
		expect(result.headline.en).toBe('High-risk AI system.');
		expect(result.explanation.en).toContain(DATES.annexI.en);
	});

	it('classifies Annex III areas as high-risk with the 2027 date', () => {
		const result = evaluate(catalog, answers(['h_employment', 'h_services']));
		expect(result.verdict).toBe('positive');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['h_employment', 'h_services']);
		expect(result.explanation.de).toContain(DATES.annexIII.de);
		expect(result.notes?.some((n) => n.de.includes('Art. 26'))).toBe(true);
	});

	it('applies the Art. 6(3) exception when a narrow task is performed without profiling', () => {
		const result = evaluate(catalog, answers(['h_employment', 'x_preparatory']));
		expect(result.verdict).toBe('conditional');
		expect(result.headline.de).toBe('Nicht hochriskant (Art. 6 Abs. 3).');
		expect(result.notes?.some((n) => n.de.includes('Art. 49 Abs. 2'))).toBe(true);
	});

	it('blocks the Art. 6(3) exception when the system profiles natural persons', () => {
		const result = evaluate(catalog, answers(['h_employment', 'x_preparatory', 'x_profiling']));
		expect(result.verdict).toBe('positive');
		expect(result.explanation.en).toContain('profiles natural persons');
	});

	it('ignores exceptions without an Annex III area', () => {
		const result = evaluate(catalog, answers(['x_procedural']));
		expect(result.headline.en).toBe('Minimal risk.');
	});

	it('finds transparency duties for chatbots and synthetic content', () => {
		const result = evaluate(catalog, answers(['t_interaction', 't_synthetic']));
		expect(result.verdict).toBe('conditional');
		expect(result.reasons).toHaveLength(2);
		expect(result.explanation.de).toContain(DATES.transparency.de);
		expect(result.explanation.de).toContain(DATES.transparencyExisting.de);
	});

	it('returns minimal risk when nothing applies', () => {
		const result = evaluate(catalog, answers());
		expect(result.verdict).toBe('negative');
		expect(result.headline.de).toBe('Minimales Risiko.');
		expect(result.reasons).toEqual([]);
	});

	it('reports unclear answers in the notes', () => {
		const result = evaluate(catalog, answers(['t_interaction'], ['h_employment']));
		expect(result.notes?.at(-1)?.de).toContain('1 Frage(n)');
	});

	it('names a machine-readable outcome for every class', () => {
		const outcome = (input: Answers) => evaluate(catalog, input).outcome;
		expect(outcome({ ...answers(), s_ai: 'no' })).toBe('kein-ki');
		expect(outcome(answers(['s_excluded']))).toBe('ausserhalb');
		expect(outcome(answers(['p_emotionwork']))).toBe('verboten');
		expect(outcome(answers(['h_annex1']))).toBe('hochrisiko');
		expect(outcome(answers(['h_employment', 'x_preparatory']))).toBe('art6-3');
		expect(outcome(answers(['t_interaction']))).toBe('art50');
		expect(outcome(answers())).toBe('minimal');
	});
});
