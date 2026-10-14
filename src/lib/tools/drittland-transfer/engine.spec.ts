import { describe, expect, it } from 'vitest';
import type { Answers, QuestionnaireCatalog } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

/** A transfer with no basis at all. */
const NONE: Answers = {
	t_transfer: 'yes',
	t_adequacy: 'no',
	t_dpf: 'na',
	t_scc: 'no',
	t_bcr: 'no',
	t_tia: 'no',
	t_measures: 'na',
	t_derogation: 'no'
};
const run = (overrides: Answers = {}) => evaluate(catalog, { ...NONE, ...overrides });

describe('Drittland-Transfer engine', () => {
	it('catalog covers every answer the engine reads', () => {
		const ids = catalog.sections.flatMap((s) => s.questions.map((q) => q.id));
		expect(ids.sort()).toEqual(Object.keys(NONE).sort());
	});

	it('finds no transfer when data stays in the EEA', () => {
		expect(run({ t_transfer: 'no' }).headline.en).toBe('No third-country transfer.');
	});

	it('accepts adequacy decisions and DPF certification', () => {
		expect(run({ t_adequacy: 'yes' }).verdict).toBe('negative');
		const dpf = run({ t_dpf: 'yes' });
		expect(dpf.verdict).toBe('negative');
		expect(dpf.reasons[0].questionId).toBe('t_dpf');
	});

	it('requires a transfer impact assessment with SCCs', () => {
		const result = run({ t_scc: 'yes' });
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('Transfer Impact Assessment fehlt.');
	});

	it('requires supplementary measures when the assessment finds gaps', () => {
		expect(run({ t_scc: 'yes', t_tia: 'yes', t_measures: 'no' }).headline.en).toBe(
			'Supplementary measures missing.'
		);
	});

	it('accepts SCCs with an assessment and no gaps', () => {
		const result = run({ t_scc: 'yes', t_tia: 'yes', t_measures: 'na' });
		expect(result.verdict).toBe('negative');
		expect(result.notes).toHaveLength(3);
	});

	it('accepts BCRs like SCCs', () => {
		expect(run({ t_bcr: 'yes', t_tia: 'yes', t_measures: 'yes' }).verdict).toBe('negative');
	});

	it('treats an Art. 49 derogation as a narrow, conditional basis', () => {
		expect(run({ t_derogation: 'yes' }).verdict).toBe('conditional');
	});

	it('finds no basis when nothing applies', () => {
		const result = run();
		expect(result.verdict).toBe('positive');
		expect(result.headline.de).toBe('Keine Grundlage für die Übermittlung.');
	});

	it('is conditional while adequacy is unclear', () => {
		expect(run({ t_adequacy: 'unknown' }).verdict).toBe('conditional');
	});
});
