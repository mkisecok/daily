import { describe, expect, it } from 'vitest';
import { distance } from './distance.js';

// Berlin is UTC+2 until 25 Oct 2026
const now = new Date('2026-10-16T15:20:00.000Z'); // 17:20 in Berlin

describe('deadline distance', () => {
	it('counts calendar days in German time, not 24-hour blocks', () => {
		// 18.10. 05:19 in Berlin is the day after tomorrow, though under 36 hours away
		expect(distance('2026-10-18T03:19:00.000Z', now, 'de')).toBe('übermorgen');
		expect(distance('2026-10-17T21:00:00.000Z', now, 'de')).toBe('morgen');
		expect(distance('2026-10-26T08:00:00.000Z', now, 'de')).toBe('in 10 Tagen');
		expect(distance('2026-10-13T08:00:00.000Z', now, 'en')).toBe('3 days ago');
	});

	it('never calls an overdue deadline "in this hour"', () => {
		expect(distance('2026-10-16T15:00:00.000Z', now, 'de')).toBe('vor 20 Minuten');
		expect(distance('2026-10-16T12:00:00.000Z', now, 'de')).toBe('vor 3 Stunden');
		expect(distance('2026-10-16T15:19:50.000Z', now, 'de')).toBe('vor 1 Minute');
	});

	it('shows hours and minutes for the rest of today and the next hours', () => {
		expect(distance('2026-10-16T20:20:00.000Z', now, 'de')).toBe('in 5 Stunden');
		expect(distance('2026-10-16T15:45:00.000Z', now, 'de')).toBe('in 25 Minuten');
	});
});
