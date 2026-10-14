import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

/** Personal data, no automated decisions, every requirement met. */
function answers(overrides: Answers = {}): Answers {
	return {
		...(Object.fromEntries(ids.map((id) => [id, 'yes'])) as Answers),
		k_automated: 'no',
		...overrides
	};
}

describe('KI & DSGVO engine', () => {
	it('every requirement question carries a remedy', () => {
		const requirements = catalog.sections.filter((s) => s.id !== 'scope');
		for (const question of requirements.flatMap((s) => s.questions)) {
			expect(question.remedy, question.id).toBeDefined();
		}
	});

	it('is out of scope without personal data', () => {
		expect(evaluate(catalog, answers({ k_personal: 'no' })).headline.en).toBe(
			'The GDPR is not engaged.'
		);
	});

	it('ignores Art. 22 when decisions are not solely automated', () => {
		expect(evaluate(catalog, answers({ k_art22: 'no' })).verdict).toBe('negative');
	});

	it('requires Art. 22 safeguards for solely automated decisions', () => {
		const result = evaluate(catalog, answers({ k_automated: 'yes', k_art22: 'no' }));
		expect(result.verdict).toBe('positive');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['k_art22']);
		expect(result.notes?.[0].de).toContain('Art. 22 Abs. 1');
	});

	it('lists gaps with remedies', () => {
		const result = evaluate(catalog, answers({ k_basis: 'no', k_processor: 'no' }));
		expect(result.headline.de).toBe('2 Lücken beim Datenschutz.');
		expect(result.notes?.some((n) => n.de.includes('Training'))).toBe(true);
	});

	it('is conditional with open points', () => {
		expect(evaluate(catalog, answers({ k_rights: 'unknown' })).verdict).toBe('conditional');
	});

	it('finds no gaps when everything is met', () => {
		expect(evaluate(catalog, answers()).headline.en).toBe('No gaps found.');
	});
});
