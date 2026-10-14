import type { Deadline, RecordTool, StoredRecord } from './types.js';
import { isTerminal } from './workflow.js';

const HOUR = 60 * 60 * 1000;

/**
 * Adds hours to an instant. Legal hour-based periods (Art. 33: 72 hours)
 * run in absolute time, so a daylight-saving change does not shift them.
 */
export function addHours(iso: string, hours: number): string {
	return new Date(Date.parse(iso) + hours * HOUR).toISOString();
}

/**
 * Adds calendar months to a date or instant, keeping the time of day. When
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

/**
 * Open deadlines of a record: none once a workflow reaches a terminal state
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
