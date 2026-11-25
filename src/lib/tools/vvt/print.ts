import { formatValue } from '../../records/format.js';
import type { RecordData } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition as avv } from '../avv-pruefung/definition.js';
import { definition as dsfa } from '../dsfa/definition.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** one line of the Art. 30 table: the letter, what it asks for, the entry's answer */
export type Art30Row = { letter: string; label: string; value: string };

/**
 * what other tools hold about a processing activity: the processors from the
 * AVV-Prüfung, the systems from the TOM-Katalog and the DPIAs, each already
 * as a line, e.g. "Lohnbüro Muster GmbH (EU/EWR)"
 */
export type Art30Links = { processors: string[]; systems: string[]; dsfas: string[] };

const lines = (...parts: string[]) => parts.filter(Boolean).join('\n');

/** the entry's values for these fields, formatted and joined; empty when none is filled */
function values(data: RecordData, ids: string[], locale: string): string {
	return ids
		.map((id) => {
			const field = fieldById(definition, id);
			return field ? formatValue(field, data[id], locale) : '';
		})
		.filter(Boolean)
		.join('\n');
}

/** the third-country line: no, or yes with where to and the safeguards */
function transfer(data: RecordData, locale: string): string {
	if (data.drittland !== true) return data.drittland === false ? text(L('Nein', 'No'), locale) : '';
	const detail = values(data, ['drittland_details', 'garantien'], locale);
	return [text(L('Ja', 'Yes'), locale), detail].filter(Boolean).join('\n');
}

/**
 * the processing as Art. 30 lists it: paragraph 1 for a controller or joint
 * controller, paragraph 2 for a processor. Every letter is listed, also when
 * the entry leaves it empty, so a gap shows on paper.
 */
export function art30Rows(
	data: RecordData,
	locale: string,
	links: Art30Links = { processors: [], systems: [], dsfas: [] }
): Art30Row[] {
	const row = (letter: string, label: Localized, value: string): Art30Row => ({
		letter,
		label: text(label, locale),
		value
	});
	const listed = (label: Localized, items: string[]) =>
		items.length > 0 ? `${text(label, locale)}: ${items.join('; ')}` : '';
	/** a line no letter of Art. 30 asks for, shown only when filled */
	const extra = (label: Localized, value: string): Art30Row[] =>
		value ? [row('', label, value)] : [];
	const tom = lines(
		values(data, ['tom'], locale),
		listed(L('Systeme im TOM-Katalog', 'Systems in the TOM catalogue'), links.systems)
	);
	if (data.rolle === 'auftragsverarbeiter') {
		return [
			row(
				'a',
				L('Verantwortliche, für die verarbeitet wird', 'Controllers on whose behalf we process'),
				values(data, ['auftraggeber'], locale)
			),
			row(
				'b',
				L('Kategorien von Verarbeitungen', 'Categories of processing'),
				values(data, ['zwecke'], locale)
			),
			row(
				'c',
				L('Übermittlungen in Drittländer', 'Transfers to third countries'),
				transfer(data, locale)
			),
			row(
				'd',
				L('Technische und organisatorische Maßnahmen', 'Technical and organisational measures'),
				tom
			)
		];
	}
	return [
		...extra(L('Kurzbeschreibung', 'Short description'), values(data, ['beschreibung'], locale)),
		...(data.rolle === 'gemeinsam'
			? [
					row(
						'a',
						L('Gemeinsam Verantwortliche', 'Joint controllers'),
						values(data, ['gemeinsam_mit'], locale)
					)
				]
			: []),
		row(
			'b',
			L('Zwecke der Verarbeitung', 'Purposes of the processing'),
			values(data, ['zwecke'], locale)
		),
		row('', L('Rechtsgrundlage', 'Legal basis'), values(data, ['rechtsgrundlagen'], locale)),
		row(
			'c',
			L('Kategorien betroffener Personen', 'Categories of data subjects'),
			values(data, ['betroffene'], locale)
		),
		row(
			'c',
			L('Kategorien personenbezogener Daten', 'Categories of personal data'),
			values(data, ['datenkategorien', 'datenkategorien_details'], locale)
		),
		row(
			'd',
			L('Kategorien von Empfängern', 'Categories of recipients'),
			lines(
				values(data, ['empfaenger', 'empfaenger_details'], locale),
				listed(L('Auftragsverarbeiter (AVV-Prüfung)', 'Processors (AVV review)'), links.processors)
			)
		),
		...extra(
			L('Schnittstellen und automatisierte Abrufe', 'Interfaces and automated retrieval'),
			values(data, ['schnittstellen'], locale)
		),
		row(
			'e',
			L('Übermittlungen in Drittländer', 'Transfers to third countries'),
			transfer(data, locale)
		),
		row(
			'f',
			L('Fristen für die Löschung', 'Time limits for erasure'),
			values(data, ['loeschfristen'], locale)
		),
		row(
			'g',
			L('Technische und organisatorische Maßnahmen', 'Technical and organisational measures'),
			tom
		),
		row(
			'',
			L('Datenschutz-Folgenabschätzung', 'Data protection impact assessment'),
			lines(values(data, ['dsfa'], locale), ...links.dsfas)
		)
	];
}

/** an entry of another tool that refers to a processing activity through its `vvt` field */
export type LinkedEntry = { title?: string; state?: string | null; data: RecordData };

/**
 * the lines other tools add to a processing activity: each processor with
 * where it processes, each system, each DPIA with the day it was signed off
 */
export function art30Links(
	linked: { avv: LinkedEntry[]; tom: LinkedEntry[]; dsfa: LinkedEntry[] },
	locale: string
): Art30Links {
	const field = (def: typeof avv, id: string, entry: LinkedEntry) => {
		const found = fieldById(def, id);
		return found ? formatValue(found, entry.data[id], locale) : '';
	};
	const named = (entry: LinkedEntry, detail: string) =>
		[entry.title ?? '', detail ? `(${detail})` : ''].filter(Boolean).join(' ');
	return {
		processors: linked.avv.map((entry) => named(entry, field(avv, 'sitz', entry))),
		systems: linked.tom.map((entry) => named(entry, '')),
		dsfas: linked.dsfa.map((entry) => {
			const signed = field(dsfa, 'freigegeben_am', entry);
			return named(
				entry,
				signed ? `${text(L('freigegeben am', 'signed off on'), locale)} ${signed}` : ''
			);
		})
	};
}
