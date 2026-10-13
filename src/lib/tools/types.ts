/** Content strings carried by tools and catalogs (not UI chrome). */
export type Localized = { de: string; en: string };

export type ToolCategory = 'datenschutz' | 'ki' | 'audit' | 'entwickler';
export type ToolStatus = 'stable' | 'beta' | 'planned';
export type ToolShape = 'questionnaire' | 'register' | 'workflow';

export type Law =
	'DSGVO' | 'KI-VO' | 'BDSG' | 'TDDDG' | 'ISO 27001' | 'ISO 42001' | 'EDPB' | 'DSK' | 'WP29';

/** A citation such as { law: 'DSGVO', ref: 'Art. 35 Abs. 3 lit. a' }. */
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
};

/* ---------- questionnaire shape ---------- */

export type QuestionType = 'yesno';
export type YesNoAnswer = 'yes' | 'no' | 'unknown';

export type Question = {
	id: string;
	type: QuestionType;
	text: Localized;
	help?: Localized;
	cite?: LegalBasis;
};

export type QuestionSection = {
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

export type VerdictLevel = 'positive' | 'conditional' | 'negative';

export type Reason = {
	questionId: string;
	text: Localized;
	cite?: LegalBasis;
};

export type QuestionnaireResult = {
	verdict: VerdictLevel;
	headline: Localized;
	explanation: Localized;
	reasons: Reason[];
	/** Obligations, dates or next steps that follow from the verdict. */
	notes?: Localized[];
	citations: LegalBasis[];
};

export type QuestionnaireEngine = (
	catalog: QuestionnaireCatalog,
	answers: Answers
) => QuestionnaireResult;
