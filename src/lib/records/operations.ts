import { diffRecord } from './diff.js';
import type { StoreError } from './store/types.js';
import type {
	AssessmentSnapshot,
	FieldChanges,
	RecordData,
	RecordToolDefinition,
	StoredRecord
} from './types.js';
import { allFields, fieldById, titleOf, validateRecord } from './validate.js';
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

export function isError(value: Planned | StoreError): value is StoreError {
	return 'ok' in value;
}
