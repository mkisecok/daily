import { optionsFor } from '../tools/answers.js';
import type {
	Answers,
	QuestionnaireCatalog,
	QuestionnaireEngine,
	YesNoAnswer
} from '../tools/types.js';
import { diffRecord } from './diff.js';
import type { StoreError } from './store/types.js';
import type {
	AssessmentSnapshot,
	FieldChanges,
	RecordData,
	RecordTool,
	RecordToolDefinition,
	StoredRecord
} from './types.js';
import {
	allFields,
	fieldById,
	titleOf,
	validateRecord,
	type ValidationErrors
} from './validate.js';
import { applyTransition, initialState } from './workflow.js';

/**
 * the decisions every store makes before writing, kept pure so the browser
 * store and the Postgres repository cannot drift apart. Each returns the
 * values to persist or the error to report.
 */

export type Planned = {
	data: RecordData;
	title: string;
	state: string | null;
	changes: FieldChanges;
};

export function planCreate(
	definition: RecordToolDefinition,
	input: Record<string, unknown>
): Planned | StoreError {
	const { data, errors } = validateRecord(definition, input);
	if (Object.keys(errors).length > 0) return { ok: false, error: 'invalid', errors };
	return {
		data,
		title: titleOf(definition, data),
		state: initialState(definition),
		changes: diffRecord({}, data)
	};
}

/**
 * edits from the record form. Assessment fields are not part of the form, so
 * they keep their stored value unless the input names them.
 */
export function planUpdate(
	definition: RecordToolDefinition,
	current: StoredRecord,
	input: Record<string, unknown>,
	expectedVersion: number
): Planned | StoreError {
	if (current.archivedAt) return { ok: false, error: 'not-allowed' };
	if (current.version !== expectedVersion) return { ok: false, error: 'conflict', current };
	const merged: Record<string, unknown> = { ...input };
	for (const field of allFields(definition)) {
		if (field.type === 'assessment' && !(field.id in input))
			merged[field.id] = current.data[field.id];
	}
	const { data, errors } = validateRecord(definition, merged);
	if (Object.keys(errors).length > 0) return { ok: false, error: 'invalid', errors };
	return {
		data,
		title: titleOf(definition, data),
		state: current.state,
		changes: diffRecord(current.data, data)
	};
}

export function planTransition(
	definition: RecordToolDefinition,
	current: StoredRecord,
	to: string,
	expectedVersion: number
): Planned | StoreError {
	if (current.archivedAt) return { ok: false, error: 'not-allowed' };
	if (current.version !== expectedVersion) return { ok: false, error: 'conflict', current };
	const result = applyTransition(definition, current, to);
	if (!result.ok) return result;
	return { data: current.data, title: current.title, state: result.state, changes: {} };
}

/** stores a snapshot in an assessment field; `derived` sets further fields from it */
export function planAssessment(
	definition: RecordToolDefinition,
	current: StoredRecord,
	field: string,
	snapshot: AssessmentSnapshot,
	derived: RecordData = {}
): Planned | StoreError {
	if (current.archivedAt) return { ok: false, error: 'not-allowed' };
	if (fieldById(definition, field)?.type !== 'assessment')
		return { ok: false, error: 'not-allowed' };
	const { data, errors } = validateRecord(definition, {
		...current.data,
		...derived,
		[field]: snapshot
	});
	if (Object.keys(errors).length > 0) return { ok: false, error: 'invalid', errors };
	return {
		data,
		title: titleOf(definition, data),
		state: current.state,
		changes: diffRecord(current.data, data)
	};
}

/** ids named by the reference fields of `data` */
export function referencedIds(definition: RecordToolDefinition, data: RecordData): string[] {
	return allFields(definition)
		.filter((field) => field.type === 'reference')
		.map((field) => data[field.id])
		.filter((value): value is string => typeof value === 'string' && value !== '');
}

/**
 * reference fields whose record is unknown to the store or belongs to
 * another tool. `toolOf` answers within the caller's scope (the
 * organisation, or the browser), so ids from elsewhere count as unknown.
 */
export function checkReferences(
	definition: RecordToolDefinition,
	data: RecordData,
	toolOf: (id: string) => string | undefined
): StoreError | null {
	const errors: ValidationErrors = {};
	for (const field of allFields(definition)) {
		if (field.type !== 'reference') continue;
		const value = data[field.id];
		if (typeof value === 'string' && value !== '' && toolOf(value) !== field.tool)
			errors[field.id] = 'invalid';
	}
	return Object.keys(errors).length > 0 ? { ok: false, error: 'invalid', errors } : null;
}

export type Questionnaire = { catalog: QuestionnaireCatalog; engine: QuestionnaireEngine };

/**
 * answers as the questionnaire offers them, or null. Every question needs
 * one of its options, as on the questionnaire page; other keys are dropped.
 */
export function readAnswerValues(catalog: QuestionnaireCatalog, input: unknown): Answers | null {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
	const given = input as Record<string, unknown>;
	const answers: Answers = {};
	for (const section of catalog.sections) {
		for (const question of section.questions) {
			const value = given[question.id];
			if (!optionsFor(question).includes(value as YesNoAnswer)) return null;
			answers[question.id] = value as YesNoAnswer;
		}
	}
	return answers;
}

/**
 * evaluates the answers with the questionnaire the assessment field names
 * and stores the result, so a client cannot hand in a verdict of its own.
 * The values the record tool derives come from the same evaluation.
 */
export function planAssessmentFromAnswers(
	tool: RecordTool,
	current: StoredRecord,
	field: string,
	input: unknown,
	expectedVersion: number,
	getQuestionnaire: (slug: string) => Questionnaire | undefined,
	at: string
): Planned | StoreError {
	if (current.archivedAt) return { ok: false, error: 'not-allowed' };
	if (current.version !== expectedVersion) return { ok: false, error: 'conflict', current };
	const def = fieldById(tool.definition, field);
	if (def?.type !== 'assessment') return { ok: false, error: 'not-allowed' };
	const questionnaire = getQuestionnaire(def.tool);
	if (!questionnaire) return { ok: false, error: 'unknown-tool' };
	const answers = readAnswerValues(questionnaire.catalog, input);
	if (!answers) return { ok: false, error: 'invalid', errors: { [field]: 'invalid' } };
	const result = questionnaire.engine(questionnaire.catalog, answers);
	const snapshot: AssessmentSnapshot = {
		tool: def.tool,
		catalogVersion: questionnaire.catalog.version,
		verdict: result.verdict,
		...(result.outcome ? { outcome: result.outcome } : {}),
		headline: result.headline,
		at
	};
	const derived = tool.engine.fromAssessment?.(field, result, current) ?? {};
	return planAssessment(tool.definition, current, field, snapshot, derived);
}

export function isError(value: Planned | StoreError): value is StoreError {
	return 'ok' in value;
}
