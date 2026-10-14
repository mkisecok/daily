import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

function answers(overrides: Answers = {}): Answers {
	return { ...(Object.fromEntries(ids.map((id) => [id, 'yes'])) as Answers), ...overrides };
}

describe('Technische Dokumentation engine', () => {
	it('asks one question per Annex IV section', () => {
		const annex = catalog.sections.find((s) => s.id === 'annex');
		expect(annex?.questions.map((q) => q.cite?.ref.match(/Nr\. (\d)/)?.[1])).toEqual([
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
			'7',
			'8',
			'9'
		]);
	});

	it('every requirement question carries a remedy', () => {
		const requirements = catalog.sections.filter((s) => s.id !== 'scope');
		for (const question of requirements.flatMap((s) => s.questions)) {
			expect(question.remedy, question.id).toBeDefined();
		}
	});

	it('does not apply to deployers or non-high-risk systems', () => {
		expect(evaluate(catalog, answers({ s_provider: 'no' })).explanation.en).toContain('deployer');
		expect(evaluate(catalog, answers({ s_highrisk: 'no' })).verdict).toBe('negative');
	});

	it('lists missing sections with remedies and the SME relief', () => {
		const result = evaluate(catalog, answers({ d_risk: 'no', d_postmarket: 'no' }));
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('Dokumentation unvollständig: 2 fehlende Teile.');
		expect(result.notes?.some((n) => n.en.includes('SMEs'))).toBe(true);
	});

	it('is conditional with unclear sections', () => {
		expect(evaluate(catalog, answers({ d_metrics: 'unknown' })).verdict).toBe('conditional');
	});

	it('confirms complete documentation', () => {
		expect(evaluate(catalog, answers()).headline.en).toBe('Documentation complete.');
	});
});
