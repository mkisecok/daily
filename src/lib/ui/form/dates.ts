import {
	CalendarDate,
	CalendarDateTime,
	parseDate,
	parseDateTime,
	type DateValue
} from '@internationalized/date';

export type Granularity = 'day' | 'minute';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MINUTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * a stored string as a calendar value, without time zones: the field shows
 * exactly what was saved. Impossible dates (30 February) count as no date.
 */
export function toDateValue(
	text: string,
	granularity: Granularity
): CalendarDate | CalendarDateTime | undefined {
	try {
		if (granularity === 'day' && DAY.test(text)) {
			const value = parseDate(text);
			return value.toString() === text ? value : undefined;
		}
		if (granularity === 'minute' && MINUTE.test(text)) {
			const value = parseDateTime(text);
			return fromDateValue(value, 'minute') === text ? value : undefined;
		}
	} catch {
		// parse errors mean no date, like an empty field
	}
	return undefined;
}

/** a calendar value in the stored format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` */
export function fromDateValue(value: DateValue | undefined, granularity: Granularity): string {
	if (!value) return '';
	const day = `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
	if (granularity === 'day' || !('hour' in value)) return day;
	return `${day}T${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}
