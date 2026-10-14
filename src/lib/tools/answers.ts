import type { Answers, Question, QuestionnaireCatalog, YesNoAnswer } from './types.js';

const BASE: readonly YesNoAnswer[] = ['yes', 'no', 'unknown'];
const WITH_NA: readonly YesNoAnswer[] = ['yes', 'no', 'unknown', 'na'];

/** The answers a question offers, in display order. */
export function optionsFor(question: Question): readonly YesNoAnswer[] {
	return question.type === 'yesnona' ? WITH_NA : BASE;
}

/** Form field name of a question, shared by the form and its readers. */
export function fieldName(question: Question): string {
	return `answer.${question.id}`;
}

/**
 * Reads a submitted form into answers. Returns the ids of questions without
 * a valid answer, so the server can reject incomplete submissions.
 */
export function readAnswers(
	catalog: QuestionnaireCatalog,
	form: FormData
): { answers: Answers; missing: string[] } {
	const answers: Answers = {};
	const missing: string[] = [];
	for (const section of catalog.sections) {
		for (const question of section.questions) {
			const value = form.get(fieldName(question));
			if (typeof value === 'string' && optionsFor(question).includes(value as YesNoAnswer)) {
				answers[question.id] = value as YesNoAnswer;
			} else {
				missing.push(question.id);
			}
		}
	}
	return { answers, missing };
}
