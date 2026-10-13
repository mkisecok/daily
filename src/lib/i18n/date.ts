const cache = new Map<string, Intl.DateTimeFormat>();

function toBcp47(locale: string): string {
	return locale === 'en' ? 'en-GB' : locale;
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = locale + JSON.stringify(options);
	let instance = cache.get(key);
	if (!instance) {
		instance = new Intl.DateTimeFormat(toBcp47(locale), options);
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
