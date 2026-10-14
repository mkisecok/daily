import type { FieldChanges, RecordData } from './types.js';

function same(a: unknown, b: unknown): boolean {
	return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Field-level changes between two versions of a record, for the history. */
export function diffRecord(before: RecordData, after: RecordData): FieldChanges {
	const changes: FieldChanges = {};
	for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
		if (!same(before[key], after[key])) changes[key] = [before[key], after[key]];
	}
	return changes;
}
