import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

/** Authority no; interest and necessity met; no risk factors; nothing in favour. */
const BASE: Answers = {
	x_authority: 'no',
	i_lawful: 'yes',
	i_specific: 'yes',
	i_present: 'yes',
	n_suitable: 'yes',
	n_less: 'yes',
	n_minimal: 'yes',
	a_special: 'no',
	a_children: 'no',
	a_scale: 'no',
	a_impact: 'no',
	f_expected: 'yes',
	f_relationship: 'no',
	f_safeguards: 'no',
	f_objection: 'no'
};

const run = (overrides: Answers = {}) => evaluate(catalog, { ...BASE, ...overrides });

describe('Interessenabwägung engine', () => {
	it('catalog covers every answer the engine reads', () => {
		const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));
		expect(ids.sort()).toEqual(Object.keys(BASE).sort());
	});

	it('excludes public authorities', () => {
		expect(run({ x_authority: 'yes' }).headline.en).toBe('Art. 6(1)(f) is not available.');
	});

	it('stops at step 1 without a lawful, specific, present interest', () => {
		const result = run({ i_present: 'no' });
		expect(result.verdict).toBe('positive');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['i_present']);
	});

	it('stops at step 2 when a less intrusive means exists', () => {
		expect(run({ n_less: 'no' }).headline.de).toBe('Verarbeitung nicht erforderlich.');
	});

	it('holds when nothing weighs against', () => {
		const result = run();
		expect(result.verdict).toBe('negative');
		expect(result.headline.en).toBe('Legitimate interest likely holds.');
	});

	it('treats an unexpected processing as weighing against', () => {
		expect(run({ f_expected: 'no' }).verdict).toBe('positive');
	});

	it('is a close call when safeguards outweigh a single risk', () => {
		const result = run({
			a_scale: 'yes',
			f_relationship: 'yes',
			f_safeguards: 'yes'
		});
		expect(result.verdict).toBe('conditional');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['a_scale']);
	});

	it('weighs children heavily and never rates them a close call', () => {
		const result = run({
			a_children: 'yes',
			f_relationship: 'yes',
			f_safeguards: 'yes',
			f_objection: 'yes'
		});
		expect(result.verdict).toBe('positive');
		expect(result.explanation.de).toContain('Kinder');
	});

	it('adds the Art. 9(2) note for special categories', () => {
		const result = run({ a_special: 'yes' });
		expect(result.notes?.some((n) => n.de.includes('Art. 9 Abs. 2'))).toBe(true);
	});

	it('is incomplete while step 1 or 2 is unclear', () => {
		expect(run({ n_minimal: 'unknown' }).headline.en).toBe('Assessment incomplete.');
	});
});
