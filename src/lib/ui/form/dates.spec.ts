import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { fromDateValue, toDateValue } from './dates.js';

describe('date picker values', () => {
	it('reads stored strings without any time zone conversion', () => {
		expect(toDateValue('2026-10-15', 'day')).toEqual(new CalendarDate(2026, 10, 15));
		// the night the clocks go back: kept exactly as typed
		expect(toDateValue('2026-10-25T02:30', 'minute')).toEqual(
			new CalendarDateTime(2026, 10, 25, 2, 30)
		);
	});

	it('writes the formats the stored fields use', () => {
		expect(fromDateValue(new CalendarDate(2026, 1, 5), 'day')).toBe('2026-01-05');
		expect(fromDateValue(new CalendarDateTime(2026, 10, 25, 2, 30), 'minute')).toBe(
			'2026-10-25T02:30'
		);
	});

	it('treats empty and broken input as no date', () => {
		expect(toDateValue('', 'day')).toBeUndefined();
		expect(toDateValue('garbage', 'minute')).toBeUndefined();
		expect(toDateValue('2026-02-30', 'day')).toBeUndefined();
		expect(fromDateValue(undefined, 'day')).toBe('');
	});

	it('round-trips both granularities', () => {
		for (const [text, granularity] of [
			['2026-12-31', 'day'],
			['2026-03-29T02:15', 'minute']
		] as const) {
			expect(fromDateValue(toDateValue(text, granularity), granularity)).toBe(text);
		}
	});
});
