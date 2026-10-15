import { fromBerlinInput, toBerlinInput } from '../../i18n/date.js';
import type { FieldDef, FieldValue, RecordData, RecordToolDefinition } from '../types.js';
import { allFields } from '../validate.js';

/** raw form state: what the inputs bind to */
export type FormValue = string | number | string[] | null;
export type FormValues = Record<string, FormValue>;

/** fields edited in the record form; assessments come from their questionnaire */
export function formFields(definition: RecordToolDefinition): FieldDef[] {
	return allFields(definition).filter((field) => field.type !== 'assessment');
}

/** a stored value as the input expects it; datetimes in German time */
export function toInput(field: FieldDef, value: FieldValue | undefined): FormValue {
	switch (field.type) {
		case 'multiselect':
			return Array.isArray(value) ? [...value] : [];
		case 'boolean':
			return value === true ? 'true' : value === false ? 'false' : '';
		case 'datetime':
			return typeof value === 'string' ? toBerlinInput(value) : '';
		case 'number':
			return typeof value === 'number' ? value : null;
		default:
			return typeof value === 'string' ? value : '';
	}
}

export function toInputs(definition: RecordToolDefinition, data: RecordData = {}): FormValues {
	return Object.fromEntries(formFields(definition).map((f) => [f.id, toInput(f, data[f.id])]));
}

/** form state as store input; the store validates and normalises it */
export function fromInputs(definition: RecordToolDefinition, values: FormValues) {
	const input: Record<string, unknown> = {};
	for (const field of formFields(definition)) {
		const raw = values[field.id];
		if (field.type === 'datetime')
			input[field.id] = typeof raw === 'string' && raw ? fromBerlinInput(raw) : '';
		else input[field.id] = raw ?? '';
	}
	return input;
}
