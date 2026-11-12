import type { Answers, Question, QuestionnaireCatalog, Visibility, YesNoAnswer } from './types.js';

const BASE: readonly YesNoAnswer[] = ['yes', 'no', 'unknown'];
const WITH_NA: readonly YesNoAnswer[] = ['yes', 'no', 'unknown', 'na'];

/** the answers a question offers, in display order */
export function optionsFor(question: Question): readonly YesNoAnswer[] {
	return question.type === 'yesnona' ? WITH_NA : BASE;
}

/** form field name of a question, shared by the form and its readers */
export function fieldName(question: Question): string {
	return `answer.${question.id}`;
}

/** whether a question or section is asked, given the answers so far */
export function isVisible(item: Visibility, answers: Answers): boolean {
	const holds = (c: { q: string; is: YesNoAnswer[] }) => {
		const answer = answers[c.q];
		return answer !== undefined && c.is.includes(answer);
	};
	if (item.hideIf?.some(holds)) return false;
	if (item.showIf && !item.showIf.some(holds)) return false;
	return true;
}

/**
 * the questions asked, given the answers so far, in catalogue order. Worked
 * out in order: a condition only sees answers to questions that are asked
 * themselves, so an answer kept in a hidden part triggers nothing.
 */
export function visibleQuestions(catalog: QuestionnaireCatalog, answers: Answers): Question[] {
	const asked: Question[] = [];
	const counted: Answers = {};
	for (const section of catalog.sections) {
		if (!isVisible(section, counted)) continue;
		for (const question of section.questions) {
			if (!isVisible(question, counted)) continue;
			asked.push(question);
			if (answers[question.id] !== undefined) counted[question.id] = answers[question.id];
		}
	}
	return asked;
}

/** only the answers to questions that are asked; the rest is kept elsewhere for going back */
export function askedAnswers(catalog: QuestionnaireCatalog, answers: Answers): Answers {
	return Object.fromEntries(
		visibleQuestions(catalog, answers)
			.filter((q) => answers[q.id] !== undefined)
			.map((q) => [q.id, answers[q.id]])
	);
}

/** every valid answer in a form, asked or not */
export function formAnswers(catalog: QuestionnaireCatalog, form: FormData): Answers {
	const given: Answers = {};
	for (const section of catalog.sections) {
		for (const question of section.questions) {
			const value = form.get(fieldName(question));
			if (typeof value === 'string' && optionsFor(question).includes(value as YesNoAnswer)) {
				given[question.id] = value as YesNoAnswer;
			}
		}
	}
	return given;
}

/**
 * reads a submitted form into answers. Returns the ids of questions without
 * a valid answer, so the server can reject incomplete submissions. Questions
 * an earlier answer hides are neither required nor kept.
 */
export function readAnswers(
	catalog: QuestionnaireCatalog,
	form: FormData
): { answers: Answers; missing: string[] } {
	const given = formAnswers(catalog, form);
	const asked = visibleQuestions(catalog, given);
	return {
		answers: askedAnswers(catalog, given),
		missing: asked.filter((q) => given[q.id] === undefined).map((q) => q.id)
	};
}
