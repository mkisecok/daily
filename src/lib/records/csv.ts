import { formatValue, stateLabel, type Titles } from './format.js';
import type { RecordToolDefinition, StoredRecord } from './types.js';
import { allFields } from './validate.js';

const SEPARATOR = ';';

function cell(value: string): string {
	return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * all fields of all records as CSV for Excel in German locales: semicolon
 * separated, CRLF, UTF-8 with BOM, values formatted like on screen.
 */
export function toCsv(
	definition: RecordToolDefinition,
	records: StoredRecord[],
	locale: string,
	titles: Titles = {}
): string {
	const fields = allFields(definition);
	const withState = Boolean(definition.workflow);
	const header = [
		...(withState ? [locale === 'en' ? 'Status' : 'Status'] : []),
		...fields.map((field) => (locale === 'en' ? field.label.en : field.label.de)),
		locale === 'en' ? 'Last changed' : 'Zuletzt geändert'
	];
	const rows = records.map((record) => [
		...(withState ? [stateLabel(definition, record.state, locale)] : []),
		...fields.map((field) => formatValue(field, record.data[field.id], locale, titles)),
		formatValue(
			{ id: 'updatedAt', type: 'datetime', label: { de: '', en: '' } },
			record.updatedAt,
			locale
		)
	]);
	return '\uFEFF' + [header, ...rows].map((row) => row.map(cell).join(SEPARATOR)).join('\r\n');
}
