import { describe, expect, it } from 'vitest';
import { lawsInUse } from './rechtsstand.js';
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
