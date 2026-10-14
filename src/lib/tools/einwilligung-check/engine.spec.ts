import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

/** Device access with optional accesses, every requirement met. */
function answers(overrides: Answers = {}): Answers {
	return { ...(Object.fromEntries(ids.map((id) => [id, 'yes'])) as Answers), ...overrides };
}

describe('Einwilligungs-Check engine', () => {
	it('every requirement question carries a remedy', () => {
		const requirements = catalog.sections.filter((s) => s.id !== 'scope');
		for (const question of requirements.flatMap((s) => s.questions)) {
			expect(question.remedy, question.id).toBeDefined();
		}
	});

	it('is out of scope without device access', () => {
		const result = evaluate(catalog, answers({ s_access: 'no' }));
		expect(result.verdict).toBe('negative');
		expect(result.headline.de).toBe('§ 25 TDDDG ist nicht berührt.');
	});

	it('needs no consent when every access is strictly necessary', () => {
		const result = evaluate(catalog, answers({ s_optional: 'no' }));
		expect(result.verdict).toBe('negative');
		expect(result.headline.en).toBe('No consent required under § 25 TDDDG.');
	});

	it('asks to document necessity when that is missing', () => {
		const result = evaluate(catalog, answers({ s_optional: 'no', c_necessary: 'no' }));
		expect(result.verdict).toBe('conditional');
		expect(result.notes?.[0].de).toContain('Cookie-Inventar');
	});

	it('lists defects such as a missing reject button and pre-ticked boxes', () => {
		const result = evaluate(catalog, answers({ b_reject: 'no', b_unticked: 'no' }));
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('2 Mängel im Einwilligungsverfahren.');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['b_reject', 'b_unticked']);
		expect(result.reasons[1].cite?.law).toBe('EuGH');
	});

	it('uses the singular for one defect', () => {
		expect(evaluate(catalog, answers({ a_withdraw: 'no' })).headline.en).toBe(
			'1 defect in the consent process.'
		);
	});

	it('treats a site without a cookie wall as fine', () => {
		expect(evaluate(catalog, answers({ b_wall: 'na', a_transfer: 'na' })).verdict).toBe('negative');
	});

	it('is conditional when requirements are unclear', () => {
		expect(evaluate(catalog, answers({ a_proof: 'unknown' })).verdict).toBe('conditional');
	});
});
