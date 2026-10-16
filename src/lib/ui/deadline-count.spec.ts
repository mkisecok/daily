import { describe, expect, it } from 'vitest';
import { dueSoon } from './deadline-count.js';

const at = (iso: string) => ({ dueAt: iso });
const now = new Date('2026-10-16T10:00:00.000Z');

describe('sidebar deadline counter', () => {
	it('counts deadlines due within seven days and flags overdue ones', () => {
		expect(
			dueSoon(
				[
					at('2026-10-15T10:00:00.000Z'),
					at('2026-10-18T10:00:00.000Z'),
					at('2026-10-30T10:00:00.000Z')
				],
				now
			)
		).toEqual({ count: 2, overdue: true });
	});

	it('is zero when nothing is close', () => {
		expect(dueSoon([at('2026-11-30T10:00:00.000Z')], now)).toEqual({ count: 0, overdue: false });
		expect(dueSoon([], now)).toEqual({ count: 0, overdue: false });
	});

	it('includes the last moment of the seventh day', () => {
		expect(dueSoon([at('2026-10-23T10:00:00.000Z')], now)).toEqual({ count: 1, overdue: false });
	});
});
