import { dayKey, fromBerlinInput } from '../i18n/date.js';
import type { Deadline, RecordTool, StoredRecord } from './types.js';
import { isTerminal } from './workflow.js';

const HOUR = 60 * 60 * 1000;

/**
 * adds hours to an instant. Legal hour-based periods (Art. 33: 72 hours)
 * run in absolute time, so a daylight-saving change does not shift them.
 */
export function addHours(iso: string, hours: number): string {
	return new Date(Date.parse(iso) + hours * HOUR).toISOString();
}

/**
 * adds calendar months to a date or instant, keeping the time of day. When
 * the target month is shorter, the period ends on its last day (Art. 3
 * Regulation 1182/71, applied by the EDPB to Art. 12(3) GDPR).
 */
export function addMonths(iso: string, months: number): string {
	const date = new Date(iso);
	const day = date.getUTCDate();
	date.setUTCDate(1);
	date.setUTCMonth(date.getUTCMonth() + months);
	const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
	date.setUTCDate(Math.min(day, lastDay));
	return date.toISOString();
}

/** a calendar date (`YYYY-MM-DD`) at a time of day in German time, as an instant */
export function dayAt(date: string, time = '09:00'): string {
	return fromBerlinInput(`${date}T${time}`);
}

/** a calendar date plus whole months, clamped to the end of shorter months */
export function dateAfterMonths(date: string, months: number): string {
	return addMonths(`${date}T00:00:00.000Z`, months).slice(0, 10);
}

/**
 * a period of months counted from the German calendar day of an event and
 * ending at the end of the corresponding day (23:59 German time), e.g.
 * Art. 12(3): a request received on 31 January is due on 28 February.
 */
export function monthsAfterDay(iso: string, months: number): string {
	return dayAt(dateAfterMonths(dayKey(iso), months), '23:59');
}

/**
 * open deadlines of a record: none once a workflow reaches a terminal state
 * or the record is archived; otherwise whatever the tool's engine derives.
 */
export function computeDeadlines(tool: RecordTool, record: StoredRecord): Deadline[] {
	if (record.archivedAt) return [];
	if (tool.definition.workflow && isTerminal(tool.definition, record.state)) return [];
	const specs = tool.engine.deadlines?.(record) ?? [];
	return specs
		.map((spec) => ({
			...spec,
			recordId: record.id,
			toolSlug: record.toolSlug,
			recordTitle: record.title
		}))
		.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
