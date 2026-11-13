import { describe, expect, it } from 'vitest';
import { lawAsOf, lawsInUse, rechtsstand } from './rechtsstand.js';
import { getTool } from './registry.js';

const laws = (slug: string) => lawsInUse(getTool(slug)!).map((law) => law.law);

describe('Rechtsstand', () => {
	it('lists the imported laws a tool cites, in the order of the Navigator', () => {
		expect(laws('vvt')).toEqual(['DSGVO']);
		expect(laws('modelltraining')).toEqual(['DSGVO', 'KI-VO']);
		expect(laws('einwilligung-check')).toContain('TDDDG');
	});

	it('carries the version of each law', () => {
		expect(lawsInUse(getTool('risikoklassifizierung')!)).toContainEqual({
			id: 'ki-vo',
			law: 'KI-VO',
			kind: 'consolidated',
			asOf: '2026-07-27'
		});
	});

	it('leaves out laws that are not imported', () => {
		expect(laws('hinweisgebersystem')).not.toContain('HinSchG');
	});
});

describe('Rechtsstand of a saved result', () => {
	const tool = getTool('risikoklassifizierung')!;

	it("uses today's versions for a live result and stores them for a saved one", () => {
		expect(rechtsstand(tool)).toEqual(lawAsOf(tool));
		expect(lawAsOf(tool)).toEqual([{ law: 'KI-VO', kind: 'consolidated', asOf: '2026-07-27' }]);
	});

	it('marks a law imported in a later version since the run', () => {
		const stored = [{ law: 'KI-VO', kind: 'consolidated', asOf: '2024-07-12' }] as const;
		expect(rechtsstand(tool, [...stored])).toEqual([{ ...stored[0], newer: '2026-07-27' }]);
		expect(rechtsstand(tool, lawAsOf(tool))).toEqual(lawAsOf(tool));
	});
});
