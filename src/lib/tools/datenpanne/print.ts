import { formatValue, type Titles } from '../../records/format.js';
import type { RecordData, StoredRecord } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';
import { notificationDue } from './engine.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** one line of the notification: its letter of Art. 33(3), if any, the question and the answer */
export type NoticeRow = { letter: string; label: string; value: string; fill?: boolean };
export type NoticePart = { id: string; title: string; rows: NoticeRow[] };

/**
 * a breach as the supervisory authority's form asks for it: the timing of
 * Art. 33(1), the four letters of Art. 33(3), the communication to data
 * subjects under Art. 34 and what else the entry knows. An empty answer
 * stays empty for the caller to mark; the data protection officer is never
 * in the entry and gets a line to fill in.
 */
export function noticeParts(
	data: RecordData,
	state: StoredRecord['state'],
	locale: string,
	titles: Titles = {}
): NoticePart[] {
	const value = (...ids: string[]) =>
		ids
			.map((id) => {
				const field = fieldById(definition, id);
				return field ? formatValue(field, data[id], locale, titles) : '';
			})
			.filter(Boolean)
			.join('\n');
	const row = (letter: string, label: Localized, answer: string, fill = false): NoticeRow => ({
		letter,
		label: text(label, locale),
		value: answer,
		...(fill ? { fill } : {})
	});

	const due = notificationDue({ data, state });
	const notified = typeof data.gemeldet_am === 'string' ? data.gemeldet_am : '';
	const dueText = due
		? formatValue({ id: 'due', type: 'datetime', label: L('', '') }, due, locale)
		: '';
	const inTime = !due
		? ''
		: notified
			? text(Date.parse(notified) <= Date.parse(due) ? L('Ja', 'Yes') : L('Nein', 'No'), locale)
			: text(L('Noch nicht gemeldet', 'Not notified yet'), locale);

	return [
		{
			id: 'zeit',
			title: text(L('Zeitlicher Ablauf (Art. 33 Abs. 1)', 'Timing (Art. 33(1))'), locale),
			rows: [
				row('', L('Kenntnis von der Verletzung', 'Became aware of the breach'), value('kenntnis')),
				row('', L('72 Stunden enden', '72 hours end'), dueText),
				row('', L('Gemeldet am', 'Notified on'), value('gemeldet_am')),
				row('', L('Innerhalb von 72 Stunden', 'Within 72 hours'), inTime),
				...(inTime === text(L('Nein', 'No'), locale)
					? [
							row(
								'',
								L('Gründe für die Verzögerung', 'Reasons for the delay'),
								value('verzoegerung')
							)
						]
					: []),
				row('', L('Aufsichtsbehörde', 'Supervisory authority'), value('behoerde')),
				row('', L('Aktenzeichen', 'Reference'), value('aktenzeichen'))
			]
		},
		{
			id: 'angaben',
			title: text(L('Angaben nach Art. 33 Abs. 3 DSGVO', 'Details under Art. 33(3) GDPR'), locale),
			rows: [
				row('a', L('Art der Verletzung', 'Nature of the breach'), value('art', 'beschreibung')),
				row(
					'a',
					L(
						'Kategorien und ungefähre Zahl der betroffenen Personen',
						'Categories and approximate number of data subjects'
					),
					value('gruppen', 'anzahl_betroffene')
				),
				row(
					'a',
					L(
						'Kategorien und ungefähre Zahl der Datensätze',
						'Categories and approximate number of records'
					),
					value('datenkategorien', 'anzahl_datensaetze')
				),
				row(
					'b',
					L(
						'Name und Kontaktdaten des Datenschutzbeauftragten oder einer Anlaufstelle',
						'Name and contact details of the data protection officer or another contact point'
					),
					'',
					true
				),
				row('c', L('Wahrscheinliche Folgen', 'Likely consequences'), value('folgen')),
				row('c', L('Risiko und Begründung', 'Risk and reasons'), value('risiko', 'begruendung')),
				row(
					'd',
					L('Ergriffene und vorgeschlagene Maßnahmen', 'Measures taken and proposed'),
					value('massnahmen')
				)
			]
		},
		{
			id: 'betroffene',
			title: text(
				L('Benachrichtigung der Betroffenen (Art. 34)', 'Communication to data subjects (Art. 34)'),
				locale
			),
			rows: [
				row('', L('Benachrichtigt am', 'Communicated on'), value('benachrichtigt_am')),
				row('', L('Ausnahme', 'Exception'), value('ausnahme'))
			]
		},
		{
			id: 'weiteres',
			title: text(L('Weitere Angaben', 'Further details'), locale),
			rows: [
				row('', L('Entdeckt durch', 'Discovered by'), value('entdeckt_durch')),
				row('', L('Beim Auftragsverarbeiter', 'At the processor'), value('auftragsverarbeiter')),
				row('', L('Daten verschlüsselt', 'Data encrypted'), value('verschluesselt')),
				row('', L('Verarbeitungstätigkeit (VVT)', 'Processing activity (record)'), value('vvt'))
			]
		}
	];
}
