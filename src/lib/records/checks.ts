import type { LegalBasis, Localized } from '../tools/types.js';
import { dayAt } from './deadlines.js';
import { formatValue } from './format.js';
import type {
	DeadlineSpec,
	FieldDef,
	FieldValue,
	RecordData,
	RecordToolDefinition,
	RecordView
} from './types.js';
import { allFields } from './validate.js';

/** the answer to a checklist point */
export type CheckStatus = 'ja' | 'nein' | 'entfaellt';

/** a stored checklist value; true/false from before the check type count as ja/nein */
export function checkStatus(value: FieldValue | undefined): CheckStatus | null {
	if (value === true || value === 'ja') return 'ja';
	if (value === false || value === 'nein') return 'nein';
	if (value === 'entfaellt') return 'entfaellt';
	return null;
}

/** done: met, or not applicable */
export const settled = (status: CheckStatus | null) => status === 'ja' || status === 'entfaellt';

export const noteId = (id: string) => `${id}_notiz`;
export const dueId = (id: string) => `${id}_frist`;

export type CheckItem = {
	id: string;
	label: Localized;
	cite?: LegalBasis;
	help?: Localized;
	/** whether "Entfällt" is offered; false for points that always apply */
	na?: boolean;
};

const L = (de: string, en: string): Localized => ({ de, en });

/** a checklist point with its note and due date, as three fields */
export function checkFields(item: CheckItem): FieldDef[] {
	return [
		{
			id: item.id,
			type: 'check',
			label: item.label,
			cite: item.cite,
			help: item.help,
			na: item.na ?? true
		},
		{
			id: noteId(item.id),
			type: 'text',
			label: L(`${item.label.de} – Notiz`, `${item.label.en} – note`),
			partOf: item.id
		},
		{
			id: dueId(item.id),
			type: 'date',
			label: L(`${item.label.de} – Frist`, `${item.label.en} – due`),
			partOf: item.id
		}
	];
}

/** a check's value with its due date and note, for reading and print */
export function formatCheck(
	field: FieldDef,
	data: RecordData,
	locale: string,
	fields: FieldDef[]
): string {
	const parts = [formatValue(field, data[field.id], locale)];
	const due = fields.find((f) => f.id === dueId(field.id));
	const note = data[noteId(field.id)];
	if (due && data[due.id]) {
		parts.push(`${locale === 'en' ? 'due' : 'Frist'} ${formatValue(due, data[due.id], locale)}`);
	}
	if (typeof note === 'string' && note) parts.push(note);
	return parts.filter(Boolean).join(' · ');
}

/** every point answered "nein" that has a due date becomes a deadline */
export function gapDeadlines(
	definition: RecordToolDefinition,
	record: RecordView,
	applies: (field: FieldDef) => boolean = () => true
): DeadlineSpec[] {
	return allFields(definition)
		.filter((field) => field.type === 'check' && applies(field))
		.flatMap((field) => {
			const due = record.data[dueId(field.id)];
			if (checkStatus(record.data[field.id]) !== 'nein' || typeof due !== 'string' || !due)
				return [];
			return [
				{
					kind: `luecke-${field.id}`,
					label: L(`Lücke schließen: ${field.label.de}`, `Close the gap: ${field.label.en}`),
					dueAt: dayAt(due),
					cite: field.cite
				}
			];
		});
}
