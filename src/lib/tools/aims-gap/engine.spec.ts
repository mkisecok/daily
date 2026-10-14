import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));
const all = (answer: Answers[string]) =>
	Object.fromEntries(ids.map((id) => [id, answer])) as Answers;

describe('AIMS-Gap-Analyse', () => {
	it('covers context, planning, Annex A and improvement with a remedy for every question', () => {
		expect(catalog.sections.map((s) => s.id)).toEqual(['kontext', 'planung', 'anhang', 'leistung']);
		expect(ids).toHaveLength(19);
		expect(catalog.sections.flatMap((s) => s.questions).every((q) => q.remedy && q.cite)).toBe(
			true
		);
	});

	it('finds no gaps when everything is met or not applicable', () => {
		expect(evaluate(catalog, all('yes'))).toMatchObject({
			verdict: 'negative',
			outcome: 'erfuellt'
		});
		expect(evaluate(catalog, { ...all('yes'), a_thirdparty: 'na' }).outcome).toBe('erfuellt');
	});

	it('lists gaps with clause and the AI Act obligations the remedy covers', () => {
		const result = evaluate(catalog, { ...all('yes'), a_data: 'no', p_competence: 'no' });
		expect(result.outcome).toBe('luecken');
		expect(result.headline.de).toBe('AIMS mit 2 Lücken.');
		expect(result.reasons.map((r) => r.cite?.ref)).toEqual(['Kap. 7.2, Anhang A.4', 'Anhang A.7']);
		const notes = result.notes!.map((n) => n.de).join('\n');
		expect(notes).toContain('KI-VO Art. 4');
		expect(notes).toContain('KI-VO Art. 10');
	});

	it('keeps unclear answers open', () => {
		expect(evaluate(catalog, { ...all('yes'), l_review: 'unknown' }).outcome).toBe('offen');
	});
});
