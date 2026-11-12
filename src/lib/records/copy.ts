import type { Localized } from '../tools/types.js';
import type { FieldDef, RecordData, RecordToolDefinition } from './types.js';
import { allFields, fieldById } from './validate.js';

/**
 * values that belong to one entry and must not carry over to a copy: dates
 * (approval, deadlines), attached questionnaire results, and checklist answers
 * with their notes, since a copied "ja" would claim work not done for the new
 * entry
 */
function ownToEntry(field: FieldDef, definition: RecordToolDefinition): boolean {
	if (field.type === 'date' || field.type === 'datetime' || field.type === 'assessment')
		return true;
	if (field.type === 'check') return true;
	if (field.partOf) return fieldById(definition, field.partOf)?.type === 'check';
	return false;
}

const SUFFIX: Localized = { de: ' (Kopie)', en: ' (copy)' };

/** an entry's data as the start of a new one: the title marked as a copy, own values left out */
export function copyData(
	definition: RecordToolDefinition,
	data: RecordData,
	locale: 'de' | 'en' = 'de'
): RecordData {
	const copy: RecordData = {};
	for (const field of allFields(definition)) {
		const value = data[field.id];
		if (value === undefined || ownToEntry(field, definition)) continue;
		copy[field.id] = value;
	}
	const title = copy[definition.titleField];
	if (typeof title === 'string' && title) copy[definition.titleField] = title + SUFFIX[locale];
	return copy;
}
