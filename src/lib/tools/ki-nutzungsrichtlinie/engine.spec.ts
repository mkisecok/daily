import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

/** A careful organisation: everything decided, nothing risky. */
const CAREFUL: Answers = {
	p_allowlist: 'yes',
	p_private: 'no',
	p_personal: 'no',
	p_confidential: 'no',
	p_review: 'yes',
	p_label: 'yes',
	p_code: 'yes',
	p_people: 'no',
	p_training: 'yes',
	p_contact: 'yes',
	p_incidents: 'yes',
	p_council: 'yes'
};
const run = (overrides: Answers = {}) => evaluate(catalog, { ...CAREFUL, ...overrides });

describe('KI-Nutzungsrichtlinie engine', () => {
	it('catalog covers every answer the engine reads', () => {
		const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));
		expect(ids.sort()).toEqual(Object.keys(CAREFUL).sort());
	});

	it('produces numbered clauses under a draft heading', () => {
		const result = run();
		expect(result.verdict).toBe('negative');
		expect(result.notesTitle?.de).toBe('Entwurf der Richtlinie');
		expect(result.notes?.map((n) => n.de.slice(0, 3))).toEqual([
			'§ 1',
			'§ 2',
			'§ 3',
			'§ 4',
			'§ 5',
			'§ 6'
		]);
	});

	it('writes the chosen data rule into the draft', () => {
		expect(run().notes?.[2].de).toContain('nicht eingegeben werden');
		expect(run({ p_personal: 'yes' }).notes?.[2].de).toContain('Auftragsverarbeitungsvertrag');
	});

	it('includes the works council clause only where one exists', () => {
		expect(run().notes?.[4].de).toContain('§ 87 Abs. 1 Nr. 6 BetrVG');
		expect(run({ p_council: 'na' }).notes?.[4].de).not.toContain('BetrVG');
	});

	it('flags risky choices', () => {
		const result = run({ p_private: 'yes', p_training: 'no' });
		expect(result.verdict).toBe('conditional');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['p_private', 'p_training']);
	});

	it('leaves placeholders for open decisions', () => {
		const result = run({ p_people: 'unknown' });
		expect(result.verdict).toBe('conditional');
		expect(result.notes?.[3].de).toContain('[Offen: Entscheidungen über Personen]');
	});

	it('keeps humans in charge of decisions about persons', () => {
		expect(run({ p_people: 'yes' }).notes?.[3].en).toContain('a human makes the decision');
	});
});
