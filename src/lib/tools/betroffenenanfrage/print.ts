import type { PrintPart, PrintRow } from '../../print/parts.js';
import { formatValue } from '../../records/format.js';
import type { RecordData } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the access reply prints once the request asks for access and its first stage is answered */
export const accessReady = (data: RecordData) =>
	Array.isArray(data.rechte) && data.rechte.includes('auskunft') && !!data.a_verarbeitet;

const RIGHTS = L(
	'Sie haben das Recht auf Berichtigung oder Löschung Ihrer Daten, auf Einschränkung der Verarbeitung und auf Widerspruch gegen die Verarbeitung (Art. 16, 17, 18, 21 DSGVO).',
	'You have the right to rectification or erasure of your data, to restriction of processing and to object to the processing (Art. 16, 17, 18, 21 GDPR).'
);
const COMPLAINT = L(
	'Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).',
	'You may lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).'
);

/**
 * the reply to an access request in the four stages of Art. 15: whether data
 * is processed, the data itself, the details of paragraph 1 lit. a to h and
 * of paragraph 2, and the copy. Lit. e and f are the same for everyone and
 * come as fixed text. A negative reply ends after the first stage.
 */
export function accessParts(data: RecordData, locale: string): PrintPart[] {
	const value = (id: string) => {
		const field = fieldById(definition, id);
		return field ? formatValue(field, data[id], locale) : '';
	};
	const row = (letter: string, label: Localized, answer: string): PrintRow => ({
		letter,
		label: text(label, locale),
		value: answer
	});
	const request: PrintPart = {
		id: 'antrag',
		title: text(L('Ihr Antrag', 'Your request'), locale),
		rows: [
			row('', L('Eingegangen am', 'Received on'), value('eingang')),
			row(
				'',
				L('Daten zu Ihrer Person werden verarbeitet', 'Data about you is processed'),
				value('a_verarbeitet')
			)
		]
	};
	if (data.a_verarbeitet === 'nein') return [request];
	return [
		request,
		{
			id: 'daten',
			title: text(L('Die zu Ihnen gespeicherten Daten', 'The data stored about you'), locale),
			rows: [row('', L('Daten', 'Data'), value('a_daten'))]
		},
		{
			id: 'angaben',
			title: text(
				L('Angaben nach Art. 15 Abs. 1 und 2 DSGVO', 'Details under Art. 15(1) and (2) GDPR'),
				locale
			),
			rows: [
				row('a', L('Verarbeitungszwecke', 'Purposes'), value('a_zwecke')),
				row('b', L('Kategorien der Daten', 'Categories of data'), value('a_kategorien')),
				row('c', L('Empfänger', 'Recipients'), value('a_empfaenger')),
				row('d', L('Speicherdauer', 'Storage period'), value('a_dauer')),
				row('e', L('Ihre Rechte', 'Your rights'), text(RIGHTS, locale)),
				row('f', L('Beschwerderecht', 'Right to complain'), text(COMPLAINT, locale)),
				row(
					'g',
					L('Herkunft der Daten', 'Source of the data'),
					value('a_herkunft') || text(L('Bei Ihnen selbst erhoben.', 'Collected from you.'), locale)
				),
				row(
					'h',
					L('Automatisierte Entscheidungen', 'Automated decisions'),
					value('a_automatisiert')
				),
				row(
					'',
					L('Drittländer (Abs. 2)', 'Third countries (para. 2)'),
					value('a_drittland') || text(L('Keine Übermittlung.', 'No transfer.'), locale)
				)
			]
		},
		{
			id: 'kopie',
			title: text(L('Kopie (Art. 15 Abs. 3)', 'Copy (Art. 15(3))'), locale),
			rows: [
				row('', L('Kopie der Daten', 'Copy of the data'), value('a_kopie')),
				...(value('a_einschraenkung')
					? [
							row(
								'',
								L('Nicht beauskunftet, mit Grund', 'Withheld, with reason'),
								value('a_einschraenkung')
							)
						]
					: [])
			]
		}
	];
}
