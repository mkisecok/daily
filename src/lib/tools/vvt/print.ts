import { formatValue } from '../../records/format.js';
import type { RecordData } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** one line of the Art. 30 table: the letter, what it asks for, the entry's answer */
export type Art30Row = { letter: string; label: string; value: string };

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
export function art30Rows(data: RecordData, locale: string): Art30Row[] {
	const row = (letter: string, label: Localized, value: string): Art30Row => ({
		letter,
		label: text(label, locale),
		value
	});
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
				values(data, ['tom'], locale)
			)
		];
	}
	return [
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
			values(data, ['empfaenger', 'empfaenger_details'], locale)
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
			values(data, ['tom'], locale)
		)
	];
}
