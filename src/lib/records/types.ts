import type {
	LegalBasis,
	Localized,
	QuestionnaireResult,
	ToolManifest,
	VerdictLevel
} from '../tools/types.js';

/* ---------- definitions (what a tool's records look like) ---------- */

export type Option = { value: string; label: Localized };

type FieldBase = {
	id: string;
	label: Localized;
	help?: Localized;
	cite?: LegalBasis;
	required?: boolean;
	/** Shown as a column in the record list. */
	listColumn?: boolean;
};

export type FieldDef = FieldBase &
	(
		| { type: 'text' | 'textarea' }
		| { type: 'select'; options: Option[] }
		| { type: 'multiselect'; options: Option[] }
		| { type: 'date' | 'datetime' }
		| { type: 'number'; unit?: Localized; min?: number }
		| { type: 'boolean' }
		/** A frozen snapshot of a questionnaire result, e.g. the risk classification. */
		| { type: 'assessment'; tool: string }
	);

export type FieldSection = { id: string; title: Localized; intro?: Localized; fields: FieldDef[] };

export type StateDef = { id: string; label: Localized; terminal?: boolean };

export type TransitionDef = {
	from: string;
	to: string;
	label: Localized;
	/** Fields that must be filled before the transition is allowed. */
	requires?: string[];
};

export type WorkflowDef = {
	states: StateDef[];
	initialState: string;
	transitions: TransitionDef[];
};

export type RecordToolDefinition = {
	slug: string;
	version: number;
	intro: Localized;
	sources: LegalBasis[];
	/** Field whose value is the record's title in lists and history. */
	titleField: string;
	sections: FieldSection[];
	/** Present for workflow tools; registers have no states. */
	workflow?: WorkflowDef;
};

/* ---------- values ---------- */

export type AssessmentSnapshot = {
	tool: string;
	catalogVersion: number;
	verdict: VerdictLevel;
	/** The questionnaire's machine-readable outcome, when it names one. */
	outcome?: string;
	headline: Localized;
	/** ISO timestamp of the assessment. */
	at: string;
};

/**
 * Stored field values. Dates are `YYYY-MM-DD`, datetimes ISO 8601 in UTC,
 * empty fields `null`.
 */
export type FieldValue = string | number | boolean | string[] | AssessmentSnapshot | null;
export type RecordData = Record<string, FieldValue>;

export type StoredRecord = {
	id: string;
	toolSlug: string;
	definitionVersion: number;
	state: string | null;
	title: string;
	data: RecordData;
	/** Increments on every write; updates must name the version they edited. */
	version: number;
	createdAt: string;
	updatedAt: string;
	archivedAt: string | null;
};

export type FieldChanges = Record<string, [FieldValue | undefined, FieldValue | undefined]>;

export type RecordEvent = {
	id: string;
	recordId: string;
	kind: 'created' | 'updated' | 'transition' | 'assessment' | 'archived';
	changes: FieldChanges | null;
	fromState: string | null;
	toState: string | null;
	at: string;
	/** Display name of the author in the full app; absent in the browser store. */
	author?: string | null;
};

export type DeadlineSpec = {
	/** Stable per record, e.g. `meldung-aufsicht`. */
	kind: string;
	label: Localized;
	dueAt: string;
	/** Legal basis shown next to the deadline. */
	cite?: LegalBasis;
};

export type Deadline = DeadlineSpec & {
	recordId: string;
	toolSlug: string;
	recordTitle: string;
};

/* ---------- tool modules ---------- */

export type RecordView = Pick<StoredRecord, 'data' | 'state'>;

export type RecordEngine = {
	deadlines?: (record: RecordView) => DeadlineSpec[];
	assess?: (record: RecordView) => QuestionnaireResult | null;
	/** Values an attached questionnaire result sets, e.g. the risk class. */
	fromAssessment?: (field: string, result: QuestionnaireResult) => RecordData;
};

export type RecordTool = {
	manifest: ToolManifest;
	definition: RecordToolDefinition;
	engine: RecordEngine;
};
