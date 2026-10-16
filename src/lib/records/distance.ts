import { dayKey } from '../i18n/date.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * how far off a deadline is, e.g. "übermorgen", "in 5 Stunden", "vor 20 Minuten".
 * Other days count as calendar days in German time; the same day shows hours
 * or minutes. Overdue amounts round away from zero, so a deadline a few
 * seconds past is "vor 1 Minute", never "in dieser Minute".
 */
export function distance(dueAt: string, now: Date, locale: string): string {
	const left = Date.parse(dueAt) - now.getTime();
	const days = Math.round(
		(Date.parse(dayKey(dueAt)) - Date.parse(dayKey(now.toISOString()))) / DAY
	);
	if (days !== 0) {
		return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
	}
	const exact = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
	const sign = left < 0 ? -1 : 1;
	const size = Math.abs(left);
	if (size < HOUR) {
		const minutes = Math.max(1, sign < 0 ? Math.ceil(size / MINUTE) : Math.round(size / MINUTE));
		return exact.format(sign * minutes, 'minute');
	}
	return exact.format(sign * Math.max(1, Math.round(size / HOUR)), 'hour');
}
