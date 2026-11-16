/** content strings carried by tools and catalogs (not UI chrome) */
export type Localized = { de: string; en: string };

export type ToolCategory = 'datenschutz' | 'ki' | 'audit' | 'schulung' | 'entwickler';
/** `retired`: merged into its `successor`; hidden from the catalogue, its entries stay readable */
export type ToolStatus = 'stable' | 'beta' | 'planned' | 'retired';
/** `utility`: an interactive tool with its own page, e.g. the repository scan */
export type ToolShape = 'questionnaire' | 'register' | 'workflow' | 'utility' | 'lesson';

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
	/** for a retired tool: the tool it was merged into */
	successor?: string;
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

/* ---------- lesson shape ---------- */

/**
 * one slide of a lesson: a title, at most five short points, an optional
 * case from daily work, speaker notes for the presenter, and the provisions
 * its statements rest on. Text in square brackets is a place the
 * organisation fills in, such as its reporting channel.
 */
export type Slide = {
	title: Localized;
	points: Localized[];
	example?: Localized;
	notes?: Localized;
	cite?: LegalBasis[];
};

/**
 * a question at the end of a lesson: exactly one option is correct, and
 * every option says why it is right or wrong
 */
export type QuizQuestion = {
	text: Localized;
	options: { text: Localized; correct: boolean; why: Localized }[];
	cite?: LegalBasis;
};

/**
 * a training module for staff (area Schulung): fixed, cited content that
 * the data protection officer presents and hands out
 */
export type Lesson = {
	version: number;
	/** who it is for, e.g. "alle Beschäftigten" */
	audience: Localized;
	/** planned length in minutes */
	minutes: number;
	/** the Schulungsnachweis topic a session of it counts as, e.g. 'pannen' */
	topic: string;
	intro: Localized;
	sources: LegalBasis[];
	slides: Slide[];
	/** three to five questions, asked after the slides and printed on the handout */
	quiz: QuizQuestion[];
	/** further Schulungsnachweis fields a session fills in, e.g. the AI literacy part */
	entry?: Record<string, string | string[]>;
};
