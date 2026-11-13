import type { Deadline, RecordToolDefinition, StoredRecord } from '../records/types.js';
import { isTerminal } from '../records/workflow.js';

/**
 * what the start page shows of the day's work. Pure logic; the page loads
 * the records and deadlines from the store.
 */

/** tools whose entries are cases to work off: each one open until its last state */
export const CASE_TOOLS = [
	'vorgang',
	'betroffenenanfrage',
	'datenpanne',
	'aufsichtsanfrage',
	'vorfallmeldung',
	'feststellungen'
] as const;

/** the tasks that come up most; each starts a new entry in its tool */
export const QUICK_START = [
	'vorgang',
	'beratungsvermerk',
	'betroffenenanfrage',
	'datenpanne',
	'avv-pruefung',
	'ki-einfuehrung',
	'software-einfuehrung',
	'feststellungen'
] as const;

const DAY = 24 * 60 * 60 * 1000;

/** deadlines already missed, and those due within the next `days`, each earliest first */
export function dueNow(deadlines: Deadline[], now: Date, days = 7) {
	const sorted = [...deadlines].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
	const limit = now.getTime() + days * DAY;
	return {
		overdue: sorted.filter((d) => Date.parse(d.dueAt) < now.getTime()),
		soon: sorted.filter((d) => {
			const due = Date.parse(d.dueAt);
			return due >= now.getTime() && due <= limit;
		}),
		later: sorted.filter((d) => Date.parse(d.dueAt) > limit).length
	};
}

/** entries of a case tool that still need work: not archived, not in a last state */
export function openCases(definition: RecordToolDefinition, records: StoredRecord[]) {
	return records.filter((record) => !record.archivedAt && !isTerminal(definition, record.state));
}

/** a case with the deadline that presses most, for sorting and for "noch 12 Tage" */
export type OpenCase = { record: StoredRecord; due: string | null };

/** open cases across tools: those with a deadline first, earliest first, then the newest */
export function sortCases(records: StoredRecord[], deadlines: Deadline[]): OpenCase[] {
	const next = new Map<string, string>();
	for (const deadline of deadlines) {
		const known = next.get(deadline.recordId);
		if (!known || deadline.dueAt < known) next.set(deadline.recordId, deadline.dueAt);
	}
	return records
		.map((record) => ({ record, due: next.get(record.id) ?? null }))
		.sort((a, b) => {
			if (a.due && b.due) return a.due.localeCompare(b.due);
			if (a.due || b.due) return a.due ? -1 : 1;
			return b.record.updatedAt.localeCompare(a.record.updatedAt);
		});
}
