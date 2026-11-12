import { describe, expect, it } from 'vitest';
import { visibleQuestions } from '../answers.js';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;
const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));

function answers(overrides: Answers = {}): Answers {
	return { ...(Object.fromEntries(ids.map((id) => [id, 'no'])) as Answers), ...overrides };
}

describe('Transparenzpflichten engine', () => {
	it('requires a notice for a provider of a chatbot', () => {
		const result = evaluate(catalog, answers({ r_provider: 'yes', a_interaction: 'yes' }));
		expect(result.verdict).toBe('positive');
		expect(result.notes?.[0].de).toContain('Art. 50 Abs. 1');
	});

	it('drops the chatbot notice when AI interaction is obvious', () => {
		const result = evaluate(
			catalog,
			answers({ r_provider: 'yes', a_interaction: 'yes', a_obvious: 'yes' })
		);
		expect(result.verdict).toBe('negative');
	});

	it('dates the marking duty by market entry', () => {
		const newer = evaluate(catalog, answers({ r_provider: 'yes', a_synthetic: 'yes' }));
		expect(newer.notes?.[0].en).toContain('since 2 August 2026');
		const older = evaluate(
			catalog,
			answers({ r_provider: 'yes', a_synthetic: 'yes', r_existing: 'yes' })
		);
		expect(older.notes?.[0].en).toContain('from 2 December 2026');
	});

	it('exempts assistive editing functions from marking', () => {
		const result = evaluate(
			catalog,
			answers({ r_provider: 'yes', a_synthetic: 'yes', a_assistive: 'yes' })
		);
		expect(result.verdict).toBe('negative');
	});

	it('limits the deepfake disclosure for artistic works', () => {
		const result = evaluate(
			catalog,
			answers({ r_deployer: 'yes', b_deepfake: 'yes', b_artistic: 'yes' })
		);
		expect(result.notes?.[0].de).toContain('nicht beeinträchtigt');
	});

	it('exempts edited public-interest texts', () => {
		const plain = evaluate(catalog, answers({ r_deployer: 'yes', b_text: 'yes' }));
		expect(plain.verdict).toBe('positive');
		const edited = evaluate(
			catalog,
			answers({ r_deployer: 'yes', b_text: 'yes', b_editorial: 'yes' })
		);
		expect(edited.verdict).toBe('negative');
	});

	it('ignores provider triggers when you are only a deployer', () => {
		const result = evaluate(catalog, answers({ r_deployer: 'yes', a_interaction: 'yes' }));
		expect(result.verdict).toBe('negative');
	});

	it('flags emotion recognition and the Art. 5 prohibition', () => {
		const result = evaluate(catalog, answers({ r_deployer: 'yes', b_emotion: 'yes' }));
		expect(result.notes?.[0].de).toContain('Art. 5 Abs. 1 lit. f');
	});

	it('reports no role when neither provider nor deployer', () => {
		expect(evaluate(catalog, answers()).headline.en).toBe('No role under Art. 50.');
	});

	it('is conditional when a decisive answer is unclear and no duty is certain', () => {
		const result = evaluate(catalog, answers({ r_provider: 'yes', a_interaction: 'unknown' }));
		expect(result.verdict).toBe('conditional');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['a_interaction']);
	});

	it('points to the Code of Practice only where content is marked or labelled', () => {
		const code = (overrides: Answers) => {
			const result = evaluate(catalog, answers(overrides));
			return {
				note: result.notes!.some((n) => n.de.includes('Praxisleitfaden')),
				cited: result.citations.some((c) => c.law === 'EU-Kommission')
			};
		};
		expect(code({ r_provider: 'yes', a_synthetic: 'yes' })).toEqual({ note: true, cited: true });
		expect(code({ r_deployer: 'yes', b_deepfake: 'yes' })).toEqual({ note: true, cited: true });
		expect(code({ r_deployer: 'yes', b_text: 'yes' })).toEqual({ note: true, cited: true });
		// a chatbot notice or an editorially reviewed text is not a labelling case
		expect(code({ r_provider: 'yes', a_interaction: 'yes' })).toEqual({
			note: false,
			cited: false
		});
		expect(code({ r_deployer: 'yes', b_text: 'yes', b_editorial: 'yes' }).cited).toBe(false);
	});

	it('words AI literacy as supporting measures (Art. 4 as amended)', () => {
		const result = evaluate(catalog, answers({ r_provider: 'yes' }));
		expect(result.notes![0].de).toBe(
			'Maßnahmen ergreifen, die die KI-Kompetenz der Beschäftigten unterstützen (Art. 4, seit 2. Februar 2025).'
		);
	});
});

describe('Transparenzpflichten: questions asked', () => {
	const asked = (answers: Answers) => visibleQuestions(catalog, answers).map((q) => q.id);

	it('asks the provider or the deployer part only for that role', () => {
		expect(asked({ r_provider: 'yes', r_deployer: 'no' })).toEqual(
			expect.arrayContaining(['r_existing', 'a_interaction', 'a_synthetic'])
		);
		expect(asked({ r_provider: 'yes', r_deployer: 'no' }).some((id) => id.startsWith('b_'))).toBe(
			false
		);
		expect(
			asked({ r_provider: 'no', r_deployer: 'yes' }).some(
				(id) => id.startsWith('a_') || id === 'r_existing'
			)
		).toBe(false);
	});

	it('asks a follow-up only after the question it refines', () => {
		expect(asked({ r_provider: 'yes', a_interaction: 'no' })).not.toContain('a_obvious');
		expect(asked({ r_provider: 'yes', a_interaction: 'yes' })).toContain('a_obvious');
		expect(asked({ r_deployer: 'yes', b_text: 'yes' })).toContain('b_editorial');
	});
});
