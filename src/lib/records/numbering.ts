import type { StoredRecord } from './types.js';

/**
 * the next running number of a register, e.g. "2026-11-007": year and month
 * of today, then one more than the highest number already used that month.
 * Archived entries count, so a number is never given twice.
 */
export function nextNumber(records: StoredRecord[], field: string, now: Date): string {
	const month = now.toISOString().slice(0, 7);
	const used = records
		.map((record) => record.data[field])
		.filter((value): value is string => typeof value === 'string' && value.startsWith(`${month}-`))
		.map((value) => Number.parseInt(value.slice(month.length + 1), 10))
		.filter((n) => Number.isFinite(n));
	return `${month}-${String(Math.max(0, ...used) + 1).padStart(3, '0')}`;
}
