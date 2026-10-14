import type {
	AssessmentSnapshot,
	FieldDef,
	FieldValue,
	RecordData,
	RecordToolDefinition
} from './types.js';

export type FieldError = 'required' | 'invalid';
export type ValidationErrors = Record<string, FieldError>;

const MAX_TEXT = 10_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TRUE = new Set(['true', 'on', 'yes', '1']);
const FALSE = new Set(['false', 'off', 'no', '0']);

export function allFields(definition: RecordToolDefinition): FieldDef[] {
	return definition.sections.flatMap((section) => section.fields);
}

export function fieldById(definition: RecordToolDefinition, id: string): FieldDef | undefined {
	return allFields(definition).find((field) => field.id === id);
}

export function isEmpty(value: FieldValue | undefined): boolean {
	return (
		value === null ||
		value === undefined ||
		value === '' ||
		(Array.isArray(value) && value.length === 0)
	);
}

function isAssessment(value: unknown): value is AssessmentSnapshot {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;
	const headline = v.headline as Record<string, unknown> | undefined;
	return (
		typeof v.tool === 'string' &&
		typeof v.catalogVersion === 'number' &&
		(v.verdict === 'positive' || v.verdict === 'conditional' || v.verdict === 'negative') &&
		typeof headline?.de === 'string' &&
		typeof headline?.en === 'string' &&
		typeof v.at === 'string' &&
		!Number.isNaN(Date.parse(v.at))
	);
}

/** Coerces one raw value (from a form or JSON) to its stored form. */
function coerce(field: FieldDef, raw: unknown): { value: FieldValue; error?: FieldError } {
	if (raw === undefined || raw === null) return { value: null };

	switch (field.type) {
		case 'text':
		case 'textarea': {
			if (typeof raw !== 'string') return { value: null, error: 'invalid' };
			const text = raw.trim();
			if (text.length > MAX_TEXT) return { value: null, error: 'invalid' };
			return { value: text === '' ? null : text };
		}
		case 'select': {
			if (raw === '') return { value: null };
			if (typeof raw !== 'string' || !field.options.some((o) => o.value === raw)) {
				return { value: null, error: 'invalid' };
			}
			return { value: raw };
		}
		case 'multiselect': {
			const list = Array.isArray(raw) ? raw : [raw];
			if (!list.every((item) => typeof item === 'string')) return { value: null, error: 'invalid' };
			const allowed = new Set(field.options.map((o) => o.value));
			const values = (list as string[]).filter((item) => item !== '');
			if (!values.every((item) => allowed.has(item))) return { value: null, error: 'invalid' };
			// Keep the catalogue order so diffs and exports are stable.
			return { value: field.options.map((o) => o.value).filter((v) => values.includes(v)) };
		}
		case 'date': {
			if (raw === '') return { value: null };
			if (typeof raw !== 'string' || !DATE.test(raw) || Number.isNaN(Date.parse(raw))) {
				return { value: null, error: 'invalid' };
			}
			return { value: raw };
		}
		case 'datetime': {
			if (raw === '') return { value: null };
			if (typeof raw !== 'string') return { value: null, error: 'invalid' };
			const time = Date.parse(raw);
			if (Number.isNaN(time)) return { value: null, error: 'invalid' };
			return { value: new Date(time).toISOString() };
		}
		case 'number': {
			if (raw === '') return { value: null };
			const number = typeof raw === 'number' ? raw : Number(raw);
			if (!Number.isFinite(number)) return { value: null, error: 'invalid' };
			if (field.min !== undefined && number < field.min) return { value: null, error: 'invalid' };
			return { value: number };
		}
		case 'boolean': {
			if (typeof raw === 'boolean') return { value: raw };
			if (raw === '') return { value: null };
			if (typeof raw === 'string' && TRUE.has(raw)) return { value: true };
			if (typeof raw === 'string' && FALSE.has(raw)) return { value: false };
			return { value: null, error: 'invalid' };
		}
		case 'reference': {
			if (raw === '') return { value: null };
			if (typeof raw !== 'string' || raw.length > 100) return { value: null, error: 'invalid' };
			return { value: raw };
		}
		case 'assessment': {
			if (raw === '') return { value: null };
			if (!isAssessment(raw)) return { value: null, error: 'invalid' };
			// Keep only the snapshot's own keys: the input may be a whole result.
			const { tool, catalogVersion, verdict, outcome, headline, at } = raw;
			return {
				value: {
					tool,
					catalogVersion,
					verdict,
					...(typeof outcome === 'string' ? { outcome } : {}),
					headline: { de: headline.de, en: headline.en },
					at: new Date(at).toISOString()
				}
			};
		}
	}
}

/**
 * Validates and normalises input for a tool's records. Unknown keys are
 * dropped; every field of the definition is present in `data` (null when
 * empty). Used by both stores and re-run on the server.
 */
export function validateRecord(
	definition: RecordToolDefinition,
	input: Record<string, unknown>
): { data: RecordData; errors: ValidationErrors } {
	const data: RecordData = {};
	const errors: ValidationErrors = {};
	for (const field of allFields(definition)) {
		const { value, error } = coerce(field, input[field.id]);
		data[field.id] = value;
		if (error) errors[field.id] = error;
		else if (field.required && isEmpty(value)) errors[field.id] = 'required';
	}
	return { data, errors };
}

/** The record title from its title field, never empty. */
export function titleOf(definition: RecordToolDefinition, data: RecordData): string {
	const value = data[definition.titleField];
	return typeof value === 'string' && value.trim() !== '' ? value.trim() : '—';
}
