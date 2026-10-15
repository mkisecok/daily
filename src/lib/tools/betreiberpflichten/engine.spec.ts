import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

/** everything fulfilled; override single answers */
function answers(overrides: Answers = {}): Answers {
	return { ...(Object.fromEntries(ids.map((id) => [id, 'yes'])) as Answers), ...overrides };
}

describe('Betreiberpflichten engine', () => {
	it('every requirement question carries a remedy', () => {
		const requirements = catalog.sections.filter((s) => s.id !== 'scope');
		for (const question of requirements.flatMap((s) => s.questions)) {
			expect(question.remedy, question.id).toBeDefined();
		}
	});

	it('does not apply to systems that are not high-risk', () => {
		const result = evaluate(catalog, answers({ s_highrisk: 'no' }));
		expect(result.verdict).toBe('negative');
		expect(result.headline.de).toBe('Art. 26 ist nicht anwendbar.');
	});

	it('does not apply to providers', () => {
		const result = evaluate(catalog, answers({ s_deployer: 'no' }));
		expect(result.explanation.en).toContain('Art. 16');
	});

	it('lists gaps with their remedies', () => {
		const result = evaluate(catalog, answers({ o_oversight: 'no', o_logs: 'no' }));
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('2 Lücken bei den Betreiberpflichten.');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['o_oversight', 'o_logs']);
		expect(result.notes?.[1].de).toContain('sechs Monate');
	});

	it('uses the singular for one gap', () => {
		expect(evaluate(catalog, answers({ d_cooperation: 'no' })).headline.en).toBe(
			'1 gap in deployer obligations.'
		);
	});

	it('treats not applicable as fulfilled', () => {
		const result = evaluate(catalog, answers({ p_workers: 'na', d_register: 'na', d_fria: 'na' }));
		expect(result.verdict).toBe('negative');
	});

	it('is conditional with open points or unclear applicability', () => {
		expect(evaluate(catalog, answers({ o_input: 'unknown' })).verdict).toBe('conditional');
		expect(evaluate(catalog, answers({ s_highrisk: 'unknown' })).verdict).toBe('conditional');
	});

	it('names the Omnibus dates when all is met', () => {
		const result = evaluate(catalog, answers());
		expect(result.headline.en).toBe('Deployer obligations met.');
		expect(result.notes?.[0].de).toContain('2. Dezember 2027');
	});
});
