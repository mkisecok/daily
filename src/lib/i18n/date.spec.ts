import { describe, expect, it } from 'vitest';
import { dayKey, formatLongDate, formatShortDate, formatTime } from './date.js';

describe('date formatting in German time', () => {
	// 22:30 UTC on 12 October is 00:30 on 13 October in Berlin (CEST, UTC+2).
	const lateEvening = '2026-10-12T22:30:00.000Z';

	it('files items under the German calendar day', () => {
		expect(dayKey(lateEvening)).toBe('2026-10-13');
	});

	it('formats long dates per locale', () => {
		expect(formatLongDate(lateEvening, 'de')).toBe('Dienstag, 13. Oktober 2026');
		// ICU versions differ on the comma after the weekday in en-GB.
		expect(formatLongDate(lateEvening, 'en')).toMatch(/^Tuesday,? 13 October 2026$/);
	});

	it('formats short dates and times', () => {
		expect(formatShortDate(lateEvening, 'de')).toBe('13.10.2026');
		expect(formatTime(lateEvening, 'de')).toBe('00:30');
	});
});
