/**
 * Dates are shown in German time regardless of where the page is rendered
 * (server, build machine or browser), so prerendered and hydrated output
 * agree and a 23:30 decision is not filed under the next day.
 */
const TIME_ZONE = 'Europe/Berlin';

const cache = new Map<string, Intl.DateTimeFormat>();

function toBcp47(locale: string): string {
	return locale === 'en' ? 'en-GB' : locale;
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = locale + JSON.stringify(options);
	let instance = cache.get(key);
	if (!instance) {
		instance = new Intl.DateTimeFormat(toBcp47(locale), { timeZone: TIME_ZONE, ...options });
		cache.set(key, instance);
	}
	return instance;
}

/** "Dienstag, 13. Oktober 2026" / "Tuesday, 13 October 2026". */
export function formatLongDate(iso: string, locale: string): string {
	return formatter(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(iso));
}

/** "13.10.2026" / "13/10/2026". */
export function formatShortDate(iso: string, locale: string): string {
	return formatter(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
		new Date(iso)
	);
}

/** "14:05". */
export function formatTime(iso: string, locale: string): string {
	return formatter(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/** Calendar day in German time as `YYYY-MM-DD`, for grouping. */
export function dayKey(iso: string): string {
	return formatter('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(iso)
	);
}

/** An instant as the value of `<input type="datetime-local">` in German time. */
export function toBerlinInput(iso: string): string {
	const parts = Object.fromEntries(
		formatter('en-CA', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
			.formatToParts(new Date(iso))
			.map((part) => [part.type, part.value])
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * A `datetime-local` value read as German time, as an ISO instant. Two
 * passes settle the offset on the days daylight saving starts or ends.
 */
export function fromBerlinInput(value: string): string {
	const asUtc = Date.parse(`${value.length === 16 ? `${value}:00` : value}Z`);
	if (Number.isNaN(asUtc)) return '';
	const offset = (time: number) =>
		Date.parse(`${toBerlinInput(new Date(time).toISOString())}:00Z`) - time;
	let time = asUtc - offset(asUtc);
	time = asUtc - offset(time);
	return new Date(time).toISOString();
}
