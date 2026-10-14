import { describe, expect, it } from 'vitest';
import { optionsFor, readAnswers } from './answers.js';
import type { QuestionnaireCatalog } from './types.js';

const catalog: QuestionnaireCatalog = {
	slug: 'test',
	version: 1,
	intro: { de: '', en: '' },
	sources: [],
	sections: [
		{
			id: 's',
			title: { de: '', en: '' },
			questions: [
				{ id: 'a', type: 'yesno', text: { de: 'A', en: 'A' } },
				{ id: 'b', type: 'yesnona', text: { de: 'B', en: 'B' } }
			]
		}
	]
};

function form(entries: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) data.set(key, value);
	return data;
}

describe('answers', () => {
	it('offers "not applicable" only on yesnona questions', () => {
		expect(optionsFor(catalog.sections[0].questions[0])).toEqual(['yes', 'no', 'unknown']);
		expect(optionsFor(catalog.sections[0].questions[1])).toContain('na');
	});

	it('reads valid answers', () => {
		expect(readAnswers(catalog, form({ 'answer.a': 'yes', 'answer.b': 'na' }))).toEqual({
			answers: { a: 'yes', b: 'na' },
			missing: []
		});
	});

	it('rejects "na" where it is not offered, and missing answers', () => {
		expect(readAnswers(catalog, form({ 'answer.a': 'na' })).missing).toEqual(['a', 'b']);
	});
});
