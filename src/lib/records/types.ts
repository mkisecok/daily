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
	/** shown as a column in the record list */
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
		/** a frozen snapshot of a questionnaire result, e.g. the risk classification */
		| { type: 'assessment'; tool: string }
		/** the id of a record of another register or workflow tool, e.g. the audit of a finding */
		| { type: 'reference'; tool: string }
	);

export type FieldSection = { id: string; title: Localized; intro?: Localized; fields: FieldDef[] };

export type StateDef = { id: string; label: Localized; terminal?: boolean };

export type TransitionDef = {
	from: string;
	to: string;
	label: Localized;
	/** fields that must be filled before the transition is allowed */
	requires?: string[];
	/** further condition on the values; returns why the step is blocked, or null */
	check?: (record: RecordView) => Localized | null;
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
	/** field whose value is the record's title in lists and history */
	titleField: string;
	sections: FieldSection[];
	/** present for workflow tools; registers have no states */
	workflow?: WorkflowDef;
	/**
	 * reference fields whose target is shown in full on the record page,
	 * together with the records that point to it, e.g. a report embedding
	 * its audit and the audit's findings.
	 */
	composes?: string[];
};

/* ---------- values ---------- */

export type AssessmentSnapshot = {
	tool: string;
	catalogVersion: number;
	verdict: VerdictLevel;
	/** the questionnaire's machine-readable outcome, when it names one */
	outcome?: string;
	headline: Localized;
	/** ISO timestamp of the assessment */
	at: string;
};

/**
 * stored field values. Dates are `YYYY-MM-DD`, datetimes ISO 8601 in UTC,
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
	/** increments on every write; updates must name the version they edited */
	version: number;
	createdAt: string;
	updatedAt: string;
	archivedAt: string | null;
};

export type FieldChanges = Record<string, [FieldValue | undefined, FieldValue | undefined]>;

export type RecordEvent = {
	id: string;
	recordId: string;
	kind: 'created' | 'updated' | 'transition' | 'assessment' | 'archived' | 'restored';
	changes: FieldChanges | null;
	fromState: string | null;
	toState: string | null;
	at: string;
	/** display name of the author in the full app; absent in the browser store */
	author?: string | null;
};

export type DeadlineSpec = {
	/** stable per record, e.g. `meldung-aufsicht` */
	kind: string;
	label: Localized;
	dueAt: string;
	/** legal basis shown next to the deadline */
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
	/** values an attached questionnaire result sets, e.g. the risk class */
	fromAssessment?: (field: string, result: QuestionnaireResult, record: RecordView) => RecordData;
};

export type RecordTool = {
	manifest: ToolManifest;
	definition: RecordToolDefinition;
	engine: RecordEngine;
};
