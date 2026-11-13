import { formatShortDate } from '../i18n/date.js';
import { formatCheck } from '../records/checks.js';
import { formatValue, type Titles } from '../records/format.js';
import type { RecordToolDefinition, StoredRecord } from '../records/types.js';
import { allFields } from '../records/validate.js';
import { cite, text } from '../tools/i18n.js';

export type PrintField = { id: string; label: string; value: string; basis: string };
/**
 * a section on paper: filled fields, checklist points still open (printed
 * with a box to tick) and the names of other empty fields
 */
export type PrintSection = {
	id: string;
	title: string;
	rows: PrintField[];
	open: string[];
	empty: string[];
};

/**
 * an entry's fields for paper, section by section: filled fields as rows with
 * their legal basis, empty ones only by name, so a nearly empty entry stays
 * short. Sections and fields hidden by the entry's scope are left out, as on
 * screen.
 */
export function printSections(
	definition: RecordToolDefinition,
	record: StoredRecord,
	locale: string,
	titles: Titles = {}
): PrintSection[] {
	const fields = allFields(definition);
	return definition.sections
		.filter((section) => !section.when || section.when(record.data))
		.map((section) => {
			const rows: PrintField[] = [];
			const open: string[] = [];
			const empty: string[] = [];
			for (const field of section.fields) {
				if (field.partOf || (field.when && !field.when(record.data))) continue;
				const value = record.data[field.id];
				let shown: string;
				if (field.type === 'assessment') {
					shown =
						value && typeof value === 'object' && !Array.isArray(value)
							? `${text(value.headline, locale)} (${formatShortDate(value.at, locale)})`
							: '';
				} else if (field.type === 'check') {
					shown = formatCheck(field, record.data, locale, fields);
				} else {
					shown = formatValue(field, value, locale, titles);
				}
				const label = text(field.label, locale);
				if (shown) {
					rows.push({
						id: field.id,
						label,
						value: shown,
						basis: field.cite ? cite(field.cite) : ''
					});
				} else if (field.type === 'check') {
					open.push(label);
				} else {
					empty.push(label);
				}
			}
			return { id: section.id, title: text(section.title, locale), rows, open, empty };
		});
}
