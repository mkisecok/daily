import { describe, expect, it } from 'vitest';
import { askedAnswers, isVisible, optionsFor, readAnswers, visibleQuestions } from './answers.js';
import { getQuestionnaire, tools } from './registry.js';
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

	it('hides on hideIf, shows on showIf, and counts an unanswered question as no condition', () => {
		expect(isVisible({ hideIf: [{ q: 'a', is: ['no'] }] }, {})).toBe(true);
		expect(isVisible({ hideIf: [{ q: 'a', is: ['no'] }] }, { a: 'no' })).toBe(false);
		expect(isVisible({ showIf: [{ q: 'a', is: ['yes'] }] }, {})).toBe(false);
		expect(isVisible({ showIf: [{ q: 'a', is: ['yes'] }] }, { a: 'yes' })).toBe(true);
	});

	it('neither requires nor keeps answers to questions an earlier answer hides', () => {
		const conditional: QuestionnaireCatalog = {
			...catalog,
			sections: [
				{
					id: 's',
					title: { de: '', en: '' },
					questions: [
						{ id: 'a', type: 'yesno', text: { de: 'A', en: 'A' } },
						{
							id: 'b',
							type: 'yesno',
							text: { de: 'B', en: 'B' },
							showIf: [{ q: 'a', is: ['yes'] }]
						}
					]
				},
				{
					id: 't',
					title: { de: '', en: '' },
					showIf: [{ q: 'b', is: ['yes'] }],
					questions: [{ id: 'c', type: 'yesno', text: { de: 'C', en: 'C' } }]
				}
			]
		};
		expect(
			readAnswers(conditional, form({ 'answer.a': 'no', 'answer.b': 'yes', 'answer.c': 'yes' }))
		).toEqual({
			answers: { a: 'no' },
			missing: []
		});
		expect(readAnswers(conditional, form({ 'answer.a': 'yes' })).missing).toEqual(['b']);
		// a kept answer in a hidden part triggers nothing further on
		expect(visibleQuestions(conditional, { a: 'no', b: 'yes' }).map((q) => q.id)).toEqual(['a']);
		expect(askedAnswers(conditional, { a: 'yes', b: 'yes', c: 'no' })).toEqual({
			a: 'yes',
			b: 'yes',
			c: 'no'
		});
	});

	it('lets every condition in every catalogue refer to an earlier question', () => {
		for (const tool of tools) {
			const catalogue = getQuestionnaire(tool.slug)?.catalog;
			if (!catalogue) continue;
			const seen = new Set<string>();
			const check = (
				item: { showIf?: { q: string }[]; hideIf?: { q: string }[] },
				where: string
			) => {
				for (const c of [...(item.showIf ?? []), ...(item.hideIf ?? [])]) {
					expect(seen.has(c.q), `${tool.slug} ${where} → ${c.q}`).toBe(true);
				}
			};
			for (const section of catalogue.sections) {
				check(section, section.id);
				for (const question of section.questions) {
					check(question, question.id);
					seen.add(question.id);
				}
			}
		}
	});
});
