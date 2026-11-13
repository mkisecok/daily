import type { PrintPart, PrintRow } from '../../print/parts.js';
import { daysAfterDay } from '../../records/deadlines.js';
import { formatValue } from '../../records/format.js';
import type { RecordData, StoredRecord } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';
import { PARAGRAPH, reportingDays } from './engine.js';

const L = (de: string, en: string): Localized => ({ de, en });

/**
 * a serious incident as the market surveillance authority asks for it under
 * Art. 73 KI-VO: the timing with the period that applies (2, 10 or 15 days)
 * and whether the report made it, what happened and how it is classified,
 * then the investigation and corrective action. An empty answer stays empty
 * for the caller to mark.
 */
export function incidentParts(
	data: RecordData,
	state: StoredRecord['state'],
	locale: string
): PrintPart[] {
	const value = (...ids: string[]) =>
		ids
			.map((id) => {
				const field = fieldById(definition, id);
				return field ? formatValue(field, data[id], locale) : '';
			})
			.filter(Boolean)
			.join('\n');
	const row = (label: Localized, answer: string): PrintRow => ({
		letter: '',
		label: text(label, locale),
		value: answer
	});

	const days = reportingDays({ data, state });
	const aware = typeof data.kenntnis === 'string' ? data.kenntnis : '';
	const due = aware ? daysAfterDay(aware, days) : '';
	const dueText = due
		? formatValue({ id: 'due', type: 'datetime', label: L('', '') }, due, locale)
		: '';
	const reported = typeof data.gemeldet_am === 'string' ? data.gemeldet_am : '';
	const inTime = !due
		? ''
		: reported
			? text(Date.parse(reported) <= Date.parse(due) ? L('Ja', 'Yes') : L('Nein', 'No'), locale)
			: text(L('Noch nicht gemeldet', 'Not reported yet'), locale);

	return [
		{
			id: 'zeit',
			title: text(L('Zeitlicher Ablauf (Art. 73 KI-VO)', 'Timing (Art. 73 AI Act)'), locale),
			rows: [
				row(L('Kenntnis vom Vorfall', 'Became aware of the incident'), value('kenntnis')),
				row(
					L('Meldefrist', 'Reporting period'),
					text(L(`${days} Tage (${PARAGRAPH[days]})`, `${days} days (${PARAGRAPH[days]})`), locale)
				),
				row(L('Frist endet', 'Period ends'), dueText),
				row(L('Gemeldet am', 'Reported on'), value('gemeldet_am')),
				row(L('Fristgerecht', 'In time'), inTime),
				row(
					L('Erstmeldung, Ergänzung folgt', 'Initial report, more to follow'),
					value('erstmeldung')
				),
				row(L('Marktüberwachungsbehörde', 'Market surveillance authority'), value('behoerde')),
				row(L('Aktenzeichen', 'Reference'), value('aktenzeichen')),
				...(data.rolle === 'betreiber'
					? [
							row(
								L('Anbieter informiert am (Art. 26 Abs. 5)', 'Provider informed on (Art. 26(5))'),
								value('anbieter_informiert_am')
							)
						]
					: [])
			]
		},
		{
			id: 'vorfall',
			title: text(L('Der Vorfall', 'The incident'), locale),
			rows: [
				row(L('KI-System', 'AI system'), value('ki_system')),
				row(L('Rolle', 'Role'), value('rolle')),
				row(L('Beschreibung', 'Description'), value('beschreibung')),
				row(L('Art des Schadens (Art. 3 Nr. 49)', 'Kind of harm (Art. 3(49))'), value('art')),
				row(L('Todesfall', 'Death'), value('todesfall')),
				row(L('Weitverbreiteter Verstoß', 'Widespread infringement'), value('weitverbreitet')),
				row(L('Zusammenhang mit dem KI-System', 'Link to the AI system'), value('kausalitaet')),
				row(
					L('Zugleich Datenpanne (Art. 33 DSGVO)', 'Also a personal data breach (Art. 33 GDPR)'),
					value('datenpanne')
				)
			]
		},
		{
			id: 'untersuchung',
			title: text(
				L(
					'Untersuchung und Korrektur (Art. 73 Abs. 6)',
					'Investigation and correction (Art. 73(6))'
				),
				locale
			),
			rows: [
				row(L('Untersuchung', 'Investigation'), value('untersuchung')),
				row(L('Korrekturmaßnahmen', 'Corrective action'), value('korrektur'))
			]
		}
	];
}
