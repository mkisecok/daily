import type { RecordData } from '../records/types.js';
import { text } from './i18n.js';
import { getLesson, getTool } from './registry.js';

/** the register a session of a lesson is recorded in */
export const LESSON_REGISTER = 'schulungsnachweis';

/** today as yyyy-mm-dd in local time, the format of a date field */
const today = (now: Date) =>
	[now.getFullYear(), now.getMonth() + 1, now.getDate()]
		.map((n) => String(n).padStart(2, '0'))
		.join('-');

/**
 * a new Schulungsnachweis entry for a session of a lesson: title, topic,
 * date, format, audience and, in the notes, the module and its version.
 * Participants and evidence stay for the person recording it. Null when the
 * slug names no lesson.
 */
export function lessonEntry(slug: string, locale: string, now = new Date()): RecordData | null {
	const lesson = getLesson(slug);
	const tool = getTool(slug);
	if (!lesson || !tool) return null;
	const name = text(tool.name, locale);
	return {
		titel: name,
		themen: [lesson.topic],
		datum: today(now),
		form: 'praesenz',
		zielgruppe: text(lesson.audience, locale),
		notizen:
			locale === 'en'
				? `Training module “${name}”, version ${lesson.version}, with ${lesson.quiz.length} review questions.`
				: `Schulungsmodul „${name}“, Stand ${lesson.version}, mit ${lesson.quiz.length} Wiederholungsfragen.`
	};
}
