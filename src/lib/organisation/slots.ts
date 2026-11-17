import type { RecordData } from '../records/types.js';
import { text } from '../tools/i18n.js';
import type { Lesson, Localized } from '../tools/types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/**
 * the details a lesson can show, by key: a lesson writes `{meldeweg}` where
 * the organisation's reporting channel goes. Empty, the placeholder shows in
 * square brackets, marked as still to be filled in.
 */
export const SLOTS = {
	meldeweg: {
		label: L('Meldeweg für Datenpannen', 'Reporting channel for breaches'),
		placeholder: L('[E-Mail, Telefon oder Formular]', '[e-mail, phone or form]')
	},
	dsb: {
		label: L('Datenschutzbeauftragte: Kontakt', 'Data protection officer: contact'),
		placeholder: L('[Name, Telefon, E-Mail]', '[name, phone, e-mail]')
	},
	ausserhalb: {
		label: L('Außerhalb der Arbeitszeit', 'Outside working hours'),
		placeholder: L('[Vertretung oder IT-Bereitschaft]', '[deputy or IT on-call]')
	},
	anschrift: {
		label: L('Anschrift des Verantwortlichen', 'Address of the controller'),
		placeholder: L('[Anschrift und Kontakt]', '[address and contact]')
	},
	ki: {
		label: L('Freigegebene KI-Werkzeuge', 'Approved AI tools'),
		placeholder: L(
			'[freigegebene KI-Werkzeuge und wo die KI-Richtlinie steht]',
			'[approved AI tools and where the AI policy is kept]'
		)
	}
} as const;

export type SlotKey = keyof typeof SLOTS;
export type Details = Partial<Record<SlotKey, string>>;

const TOKEN = /\{([a-z]+)\}/g;
const isSlot = (key: string): key is SlotKey => key in SLOTS;

/** the details kept in the organisation's entry, trimmed; empty ones left out */
export function detailsOf(data: RecordData | undefined): Details {
	const details: Details = {};
	for (const key of Object.keys(SLOTS) as SlotKey[]) {
		const value = data?.[key];
		if (typeof value === 'string' && value.trim())
			details[key] = value.trim().replace(/\s*\n\s*/g, ', ');
	}
	return details;
}

/** the keys a text uses, in order */
export function slotsIn(value: string): string[] {
	return [...value.matchAll(TOKEN)].map((match) => match[1]);
}

/** a lesson's text with the organisation's details, or the marked placeholder where one is missing */
export function fill(value: string, details: Details, locale: string): string {
	return value.replace(TOKEN, (token, key: string) =>
		isSlot(key) ? (details[key] ?? text(SLOTS[key].placeholder, locale)) : token
	);
}

/** every detail a lesson uses, in the order of the slots */
export function lessonSlots(lesson: Lesson): SlotKey[] {
	const used = new Set(
		lesson.slides.flatMap((slide) =>
			[slide.title, ...slide.points, ...(slide.example ? [slide.example] : [])].flatMap((value) =>
				slotsIn(value.de)
			)
		)
	);
	return (Object.keys(SLOTS) as SlotKey[]).filter((key) => used.has(key));
}
