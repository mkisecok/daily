/** content strings carried by tools and catalogs (not UI chrome) */
export type Localized = { de: string; en: string };

export type ToolCategory = 'datenschutz' | 'ki' | 'audit' | 'entwickler';
export type ToolStatus = 'stable' | 'beta' | 'planned';
/** `utility`: an interactive tool with its own page, e.g. the repository scan */
export type ToolShape = 'questionnaire' | 'register' | 'workflow' | 'utility';

export type Law =
	| 'DSGVO'
	| 'KI-VO'
	| 'BDSG'
	| 'TDDDG'
	| 'BetrVG'
	| 'ISO 27001'
	| 'ISO 42001'
	| 'EDPB'
	| 'DSK'
	| 'WP29'
	| 'EuGH'
	| 'BVerwG'
	| 'StGB'
	| 'DDG'
	| 'UWG'
	| 'VwGO'
	| 'OWiG'
	| 'Data Act'
	| 'AGG'
	| 'ArbGG'
	| 'BGB'
	| 'GmbHG'
	| 'KUG'
	| 'HinSchG'
	| 'KI-MIG'
	| 'EU-Kommission'
	| 'BSI';

/** a citation such as { law: 'DSGVO', ref: 'Art. 35 Abs. 3 lit. a' } */
export type LegalBasis = { law: Law; ref: string; title?: Localized };

export type ToolManifest = {
	slug: string;
	category: ToolCategory;
	status: ToolStatus;
	shape: ToolShape;
	version: number;
	name: Localized;
	summary: Localized;
	legalBasis: LegalBasis[];
	/** the day a lawyer or data protection officer reviewed the tool; see docs/legal-review.md */
	reviewedAt?: string;
};

/* ---------- questionnaire shape ---------- */

/** `yesnona` adds "not applicable" for duties that only exist in some situations */
export type QuestionType = 'yesno' | 'yesnona';
export type YesNoAnswer = 'yes' | 'no' | 'unknown' | 'na';

/** an earlier question and the answers that trigger a condition */
export type Condition = { q: string; is: YesNoAnswer[] };

/**
 * when a question or section is asked: `hideIf` hides it as soon as any
 * condition holds; `showIf` shows it only once one holds. An unanswered
 * question holds no condition.
 */
export type Visibility = { showIf?: Condition[]; hideIf?: Condition[] };

export type Question = Visibility & {
	id: string;
	type: QuestionType;
	text: Localized;
	help?: Localized;
	cite?: LegalBasis;
	/** checklist questions: what to do when the answer is "no" */
	remedy?: Localized;
};

export type QuestionSection = Visibility & {
	id: string;
	title: Localized;
	intro?: Localized;
	questions: Question[];
};

export type QuestionnaireCatalog = {
	slug: string;
	version: number;
	intro: Localized;
	sections: QuestionSection[];
	sources: LegalBasis[];
};

export type Answers = Record<string, YesNoAnswer>;

/**
 * severity, not truth value: `positive` means something applies that demands
 * action (shown in wax red), `conditional` needs a judgement or open points
 * (navy), `negative` means nothing to do (blue).
 */
export type VerdictLevel = 'positive' | 'conditional' | 'negative';

export type Reason = {
	questionId: string;
	text: Localized;
	cite?: LegalBasis;
};

export type QuestionnaireResult = {
	verdict: VerdictLevel;
	/** machine-readable outcome for tools that take the result over, e.g. `hochrisiko` */
	outcome?: string;
	headline: Localized;
	explanation: Localized;
	reasons: Reason[];
	/** obligations, dates or next steps that follow from the verdict */
	notes?: Localized[];
	/** heading for `notes` when "Obligations and notes" does not fit, e.g. generated clauses */
	notesTitle?: Localized;
	citations: LegalBasis[];
	/** the law versions a saved result was based on; a live result uses today's */
	lawAsOf?: LawAsOf[];
};

/** the version of an imported law a tool cites, e.g. the KI-VO as consolidated on 27 July 2026 */
export type LawAsOf = { law: Law; kind: 'consolidated' | 'amended'; asOf: string };

export type QuestionnaireEngine = (
	catalog: QuestionnaireCatalog,
	answers: Answers
) => QuestionnaireResult;
