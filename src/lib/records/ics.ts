import type { Deadline } from './types.js';

/** `20261027T080000Z` */
function stamp(iso: string): string {
	return new Date(iso)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}

function escape(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r?\n/g, '\\n');
}

/** Folds lines longer than 75 octets as RFC 5545 requires. */
function fold(line: string): string {
	const bytes = new TextEncoder().encode(line);
	if (bytes.length <= 75) return line;
	const parts: string[] = [];
	let current = '';
	let size = 0;
	for (const char of line) {
		const charSize = new TextEncoder().encode(char).length;
		if (size + charSize > (parts.length === 0 ? 75 : 74)) {
			parts.push(current);
			current = '';
			size = 0;
		}
		current += char;
		size += charSize;
	}
	parts.push(current);
	return parts.join('\r\n ');
}

/**
 * Deadlines as an iCalendar file: one 15-minute event ending at the due
 * time, with a reminder 24 hours before. UIDs are stable per record and
 * deadline kind, so re-importing updates instead of duplicating.
 */
export function toIcs(deadlines: Deadline[], locale: string, now: Date = new Date()): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Daily//Fristen//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH'
	];
	for (const deadline of deadlines) {
		const label = locale === 'en' ? deadline.label.en : deadline.label.de;
		const start = new Date(Date.parse(deadline.dueAt) - 15 * 60 * 1000).toISOString();
		lines.push(
			'BEGIN:VEVENT',
			`UID:${deadline.recordId}-${deadline.kind}@dai-ly.de`,
			`DTSTAMP:${stamp(now.toISOString())}`,
			`DTSTART:${stamp(start)}`,
			`DTEND:${stamp(deadline.dueAt)}`,
			`SUMMARY:${escape(`${label} – ${deadline.recordTitle}`)}`,
			...(deadline.cite
				? [`DESCRIPTION:${escape(`${deadline.cite.ref} ${deadline.cite.law}`)}`]
				: []),
			'BEGIN:VALARM',
			'ACTION:DISPLAY',
			`DESCRIPTION:${escape(label)}`,
			'TRIGGER:-PT24H',
			'END:VALARM',
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
