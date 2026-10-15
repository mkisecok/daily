import { formatShortDate, formatTime } from '../i18n/date.js';
import type { FieldDef, FieldValue, RecordToolDefinition } from './types.js';
import { stateById } from './workflow.js';

type Locale = string;

function pick(value: { de: string; en: string }, locale: Locale): string {
	return locale === 'en' ? value.en : value.de;
}

/** titles of referenced records by id, for reference fields */
export type Titles = Record<string, string>;

/** a stored value as readable text, in German time and the given locale */
export function formatValue(
	field: FieldDef,
	value: FieldValue | undefined,
	locale: Locale,
	titles: Titles = {}
): string {
	if (value === null || value === undefined || value === '') return '';
	switch (field.type) {
		case 'select': {
			const option = field.options.find((o) => o.value === value);
			return option ? pick(option.label, locale) : String(value);
		}
		case 'multiselect':
			return Array.isArray(value)
				? value
						.map((v) => field.options.find((o) => o.value === v))
						.filter((o) => o !== undefined)
						.map((o) => pick(o.label, locale))
						.join(', ')
				: '';
		case 'boolean':
			return value === true
				? pick({ de: 'Ja', en: 'Yes' }, locale)
				: pick({ de: 'Nein', en: 'No' }, locale);
		case 'date':
			return typeof value === 'string' ? formatShortDate(value, locale) : '';
		case 'datetime':
			return typeof value === 'string'
				? `${formatShortDate(value, locale)} ${formatTime(value, locale)}`
				: '';
		case 'number':
			return typeof value === 'number'
				? `${value.toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')}${field.unit ? ` ${pick(field.unit, locale)}` : ''}`
				: '';
		case 'reference':
			return typeof value === 'string' ? (titles[value] ?? '—') : '';
		case 'assessment':
			return typeof value === 'object' && value !== null && !Array.isArray(value)
				? pick(value.headline, locale)
				: '';
		default:
			return String(value);
	}
}

export function stateLabel(
	definition: RecordToolDefinition,
	state: string | null,
	locale: Locale
): string {
	const def = stateById(definition, state);
	return def ? pick(def.label, locale) : '';
}
