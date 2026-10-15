import type { Answers, Localized, Question, QuestionnaireCatalog, Reason } from './types.js';

export type ChecklistFindings = {
	/** requirements answered "no" */
	gaps: Reason[];
	/** requirements answered "unclear" */
	open: Reason[];
	/** the remedy of every gap, in catalog order */
	remedies: Localized[];
};

function reason(question: Question): Reason {
	return { questionId: question.id, text: question.text, cite: question.cite };
}

/**
 * walks the requirement sections of a checklist tool. "Not applicable" and
 * "yes" count as fulfilled; questions outside `sectionIds` are ignored.
 */
export function auditSections(
	catalog: QuestionnaireCatalog,
	answers: Answers,
	sectionIds: readonly string[]
): ChecklistFindings {
	const findings: ChecklistFindings = { gaps: [], open: [], remedies: [] };
	for (const section of catalog.sections) {
		if (!sectionIds.includes(section.id)) continue;
		for (const question of section.questions) {
			const answer = answers[question.id];
			if (answer === 'no') {
				findings.gaps.push(reason(question));
				if (question.remedy) findings.remedies.push(question.remedy);
			} else if (answer === 'unknown' || answer === undefined) {
				findings.open.push(reason(question));
			}
		}
	}
	return findings;
}

/** looks a question up by id, for engines that cite single answers */
export function questionById(catalog: QuestionnaireCatalog, id: string): Question | undefined {
	for (const section of catalog.sections) {
		const question = section.questions.find((q) => q.id === id);
		if (question) return question;
	}
	return undefined;
}

export function reasonFor(catalog: QuestionnaireCatalog, id: string): Reason {
	const question = questionById(catalog, id);
	return question ? reason(question) : { questionId: id, text: { de: id, en: id } };
}

/** "3 Lücken" / "3 gaps" style counts */
export function count(n: number, singular: Localized, plural: Localized): Localized {
	return {
		de: `${n} ${n === 1 ? singular.de : plural.de}`,
		en: `${n} ${n === 1 ? singular.en : plural.en}`
	};
}
