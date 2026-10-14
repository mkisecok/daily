import { describe, expect, it } from 'vitest';
import { auditSections, count, reasonFor } from './checklist.js';
import type { QuestionnaireCatalog } from './types.js';

const catalog: QuestionnaireCatalog = {
	slug: 'test',
	version: 1,
	intro: { de: '', en: '' },
	sources: [],
	sections: [
		{
			id: 'scope',
			title: { de: '', en: '' },
			questions: [{ id: 'applies', type: 'yesno', text: { de: 'Gilt?', en: 'Applies?' } }]
		},
		{
			id: 'items',
			title: { de: '', en: '' },
			questions: [
				{
					id: 'a',
					type: 'yesno',
					text: { de: 'A', en: 'A' },
					remedy: { de: 'A beheben', en: 'Fix A' }
				},
				{ id: 'b', type: 'yesnona', text: { de: 'B', en: 'B' } },
				{ id: 'c', type: 'yesno', text: { de: 'C', en: 'C' } }
			]
		}
	]
};

describe('auditSections', () => {
	it('collects gaps with remedies and open points, ignoring other sections', () => {
		const findings = auditSections(catalog, { applies: 'no', a: 'no', b: 'na', c: 'unknown' }, [
			'items'
		]);
		expect(findings.gaps.map((g) => g.questionId)).toEqual(['a']);
		expect(findings.remedies).toEqual([{ de: 'A beheben', en: 'Fix A' }]);
		expect(findings.open.map((o) => o.questionId)).toEqual(['c']);
	});

	it('treats yes and not applicable as fulfilled', () => {
		const findings = auditSections(catalog, { a: 'yes', b: 'na', c: 'yes' }, ['items']);
		expect(findings).toEqual({ gaps: [], open: [], remedies: [] });
	});
});

describe('helpers', () => {
	it('builds reasons from question ids', () => {
		expect(reasonFor(catalog, 'applies').text.en).toBe('Applies?');
	});

	it('pluralises counts', () => {
		const word = { de: 'Lücke', en: 'gap' };
		const words = { de: 'Lücken', en: 'gaps' };
		expect(count(1, word, words)).toEqual({ de: '1 Lücke', en: '1 gap' });
		expect(count(3, word, words).de).toBe('3 Lücken');
	});
});
