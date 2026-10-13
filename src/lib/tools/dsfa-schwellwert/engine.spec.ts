import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const allIds = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

function answers(yes: string[] = [], unknown: string[] = []): Answers {
	return Object.fromEntries(
		allIds.map((id) => [id, yes.includes(id) ? 'yes' : unknown.includes(id) ? 'unknown' : 'no'])
	) as Answers;
}

describe('DSFA-Schwellwert engine', () => {
	it('catalog has the three statutory examples, the DSK item and nine criteria', () => {
		expect(allIds).toEqual([
			'art35_a',
			'art35_b',
			'art35_c',
			'dsk_list',
			'c1',
			'c2',
			'c3',
			'c4',
			'c5',
			'c6',
			'c7',
			'c8',
			'c9'
		]);
	});

	it('requires a DPIA for any Art. 35(3) example', () => {
		for (const id of ['art35_a', 'art35_b', 'art35_c']) {
			const result = evaluate(catalog, answers([id]));
			expect(result.verdict).toBe('positive');
			expect(result.reasons.map((r) => r.questionId)).toEqual([id]);
			expect(result.reasons[0].cite?.ref).toContain('Art. 35 Abs. 3');
		}
	});

	it('requires a DPIA for a DSK must-list entry', () => {
		const result = evaluate(catalog, answers(['dsk_list']));
		expect(result.verdict).toBe('positive');
		expect(result.explanation.de).toContain('Muss-Liste');
	});

	it('requires a DPIA for two or more WP 248 criteria', () => {
		const result = evaluate(catalog, answers(['c3', 'c7']));
		expect(result.verdict).toBe('positive');
		expect(result.reasons).toHaveLength(2);
		expect(result.explanation.en).toContain('2 of the nine');
	});

	it('asks to consider and document with exactly one criterion', () => {
		const result = evaluate(catalog, answers(['c5']));
		expect(result.verdict).toBe('conditional');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['c5']);
	});

	it('finds no DPIA necessary when nothing applies', () => {
		const result = evaluate(catalog, answers());
		expect(result.verdict).toBe('negative');
		expect(result.reasons).toEqual([]);
		expect(result.citations).toEqual(catalog.sources);
	});

	it('treats unknown as not-yes but reports it', () => {
		const result = evaluate(catalog, answers(['c1'], ['c2', 'art35_a']));
		expect(result.verdict).toBe('conditional');
		expect(result.explanation.de).toContain('2 Frage(n)');
	});

	it('lists statutory reasons before criteria', () => {
		const result = evaluate(catalog, answers(['c9', 'art35_b']));
		expect(result.reasons.map((r) => r.questionId)).toEqual(['art35_b', 'c9']);
	});
});
