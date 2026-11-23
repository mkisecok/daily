import { formatShortDate } from '../../i18n/date.js';
import type { Details } from '../../organisation/slots.js';
import type { PrintRow as HeadRow } from '../../print/meta.js';
import type { PrintPart, PrintRow } from '../../print/parts.js';
import { formatValue } from '../../records/format.js';
import type { RecordData, StoredRecord } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** a controller informs; a processor's entry has no notice of its own (Art. 13 binds the controller) */
export const noticeReady = (data: RecordData) => data.rolle !== 'auftragsverarbeiter';

const has = (data: RecordData, id: string, value: string) =>
	Array.isArray(data[id]) && (data[id] as string[]).includes(value);

/**
 * the head of the notice: who informs, about which processing, for whom
 * and as of when
 */
export function noticeHead(
	record: StoredRecord,
	organisation: string | null | undefined,
	locale: string
): HeadRow[] {
	const rows: HeadRow[] = [];
	if (organisation) {
		rows.push({ label: text(L('Verantwortlicher', 'Controller'), locale), value: organisation });
	}
	rows.push({ label: text(L('Verarbeitung', 'Processing'), locale), value: record.title });
	const field = fieldById(definition, 'betroffene');
	const whom = field ? formatValue(field, record.data.betroffene, locale) : '';
	if (whom) rows.push({ label: text(L('Für', 'For'), locale), value: whom });
	rows.push({
		label: text(L('Stand', 'As of'), locale),
		value: formatShortDate(record.updatedAt, locale)
	});
	return rows;
}

const RIGHTS = L(
	'Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20 DSGVO).',
	'You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and data portability (Art. 20 GDPR).'
);
const OBJECTION = L(
	'Sie können der Verarbeitung aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen (Art. 21 Abs. 1 DSGVO).',
	'You may object at any time to the processing on grounds relating to your particular situation (Art. 21(1) GDPR).'
);
const WITHDRAWAL = L(
	'Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen; die bis dahin erfolgte Verarbeitung bleibt rechtmäßig (Art. 7 Abs. 3 DSGVO).',
	'You may withdraw your consent at any time with effect for the future; processing carried out until then remains lawful (Art. 7(3) GDPR).'
);
const COMPLAINT = L(
	'Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem Mitgliedstaat Ihres Aufenthalts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes (Art. 77 DSGVO).',
	'You may lodge a complaint with a data protection supervisory authority, in particular in the Member State of your residence, place of work or the alleged infringement (Art. 77 GDPR).'
);
/** the bases of Art. 6(1) with their full citation, for a reader who does not know the VVT's short form */
const BASES: Record<string, Localized> = {
	einwilligung: L('Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)', 'Consent (Art. 6(1)(a) GDPR)'),
	vertrag: L(
		'Vertrag oder vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO)',
		'Contract or pre-contractual steps (Art. 6(1)(b) GDPR)'
	),
	pflicht: L(
		'Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)',
		'Legal obligation (Art. 6(1)(c) GDPR)'
	),
	lebenswichtig: L(
		'Lebenswichtige Interessen (Art. 6 Abs. 1 lit. d DSGVO)',
		'Vital interests (Art. 6(1)(d) GDPR)'
	),
	oeffentlich: L(
		'Öffentliche Aufgabe (Art. 6 Abs. 1 lit. e DSGVO)',
		'Public task (Art. 6(1)(e) GDPR)'
	),
	interesse: L(
		'Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)',
		'Legitimate interests (Art. 6(1)(f) GDPR)'
	)
};

const NO_AUTOMATION = L(
	'Eine automatisierte Entscheidung einschließlich Profiling findet nicht statt.',
	'No automated decision-making including profiling takes place.'
);

const NO_TRANSFER = L(
	'Eine Übermittlung in Drittländer ist nicht vorgesehen.',
	'No transfer to third countries is intended.'
);

/**
 * the information of Art. 13 DSGVO for one processing, or of Art. 14 when
 * the data comes from others, filled from its entry in the record of
 * processing activities and the organisation's details. Where the record
 * leaves the interests, the obligation to provide, automated decisions or
 * the source empty, a line to fill in stays; what the record should hold
 * and does not stays empty for the caller to mark. The rights come as fixed text, the right to object apart from the
 * others where it applies (Art. 21 Abs. 4).
 */
export function noticeParts(
	data: RecordData,
	locale: string,
	organisation: string | null | undefined,
	details: Details = {}
): PrintPart[] {
	const value = (...ids: string[]) =>
		ids
			.map((id) => {
				const field = fieldById(definition, id);
				return field ? formatValue(field, data[id], locale) : '';
			})
			.filter(Boolean)
			.join('\n');
	const row = (letter: string, label: Localized, answer: string, fill = false): PrintRow => ({
		letter,
		label: text(label, locale),
		value: answer,
		...(fill && !answer ? { fill } : {})
	});

	const bases = Array.isArray(data.rechtsgrundlagen)
		? (data.rechtsgrundlagen as string[])
				.map((basis) => {
					if (BASES[basis]) return text(BASES[basis], locale);
					const field = fieldById(definition, 'rechtsgrundlagen');
					return field ? formatValue(field, [basis], locale) : basis;
				})
				.join('\n')
		: '';
	const controller = [organisation, details.anschrift].filter(Boolean).join('\n');
	const transfer =
		data.drittland === true
			? value('drittland_details', 'garantien')
			: data.drittland === false
				? text(NO_TRANSFER, locale)
				: '';

	/** Art. 14 for data from others; data partly from the person keeps Art. 13 and names the source */
	const art14 = data.herkunft === 'dritte';
	const interest = has(data, 'rechtsgrundlagen', 'interesse');
	const interests = row(
		art14 ? 'b' : 'd',
		L('Berechtigte Interessen, die verfolgt werden', 'Legitimate interests pursued'),
		value('interessen'),
		true
	);
	const source = row(
		art14 ? 'f' : '',
		L('Quelle der Daten', 'Source of the data'),
		value('quelle'),
		true
	);
	const automated = row(
		art14 ? 'g' : 'f',
		L(
			'Automatisierte Entscheidungen einschließlich Profiling',
			'Automated decisions including profiling'
		),
		data.automatisiert === true
			? value('automatisiert_logik')
			: data.automatisiert === false
				? text(NO_AUTOMATION, locale)
				: '',
		true
	);

	const first: PrintRow[] = [
		row('a', L('Verantwortlicher und Kontakt', 'Controller and contact'), controller, true),
		...(data.rolle === 'gemeinsam'
			? [
					row(
						'a',
						L(
							'Gemeinsam Verantwortliche, das Wesentliche der Vereinbarung (Art. 26 Abs. 2)',
							'Joint controllers, the essence of the arrangement (Art. 26(2))'
						),
						value('gemeinsam_mit')
					)
				]
			: []),
		row(
			'b',
			L('Datenschutzbeauftragte: Kontakt', 'Data protection officer: contact'),
			details.dsb ?? '',
			true
		),
		row('c', L('Zwecke der Verarbeitung', 'Purposes of the processing'), value('zwecke')),
		row('c', L('Rechtsgrundlagen', 'Legal bases'), bases),
		...(interest && !art14 ? [interests] : []),
		...(art14
			? [
					row(
						'd',
						L('Kategorien personenbezogener Daten', 'Categories of personal data'),
						value('datenkategorien')
					)
				]
			: []),
		row('e', L('Empfänger', 'Recipients'), value('empfaenger', 'empfaenger_details')),
		row(
			'f',
			L('Übermittlung in Drittländer und Garantien', 'Transfer to third countries and safeguards'),
			transfer
		),
		...(data.herkunft === 'beides' ? [source] : [])
	];

	const objection = interest || has(data, 'rechtsgrundlagen', 'oeffentlich');
	const consent = has(data, 'rechtsgrundlagen', 'einwilligung');
	const [rights, withdrawal, complaint] = art14 ? ['c', 'd', 'e'] : ['b', 'c', 'd'];
	const provision = [value('bereitstellung'), value('bereitstellung_folgen')]
		.filter(Boolean)
		.join('. ');
	const second: PrintRow[] = [
		row('a', L('Speicherdauer', 'Storage period'), value('loeschfristen')),
		...(interest && art14 ? [interests] : []),
		row(rights, L('Ihre Rechte', 'Your rights'), text(RIGHTS, locale)),
		...(objection
			? [row(rights, L('Widerspruchsrecht', 'Right to object'), text(OBJECTION, locale))]
			: []),
		...(consent
			? [
					row(
						withdrawal,
						L('Widerruf der Einwilligung', 'Withdrawing consent'),
						text(WITHDRAWAL, locale)
					)
				]
			: []),
		row(complaint, L('Beschwerderecht', 'Right to complain'), text(COMPLAINT, locale)),
		...(art14
			? [source]
			: [
					row(
						'e',
						L(
							'Pflicht zur Bereitstellung und Folgen, wenn Sie die Daten nicht bereitstellen',
							'Whether you must provide the data and what happens if you do not'
						),
						provision,
						true
					)
				]),
		automated
	];

	const article = art14 ? '14' : '13';
	return [
		{
			id: 'abs1',
			title: text(
				L(`Angaben nach Art. ${article} Abs. 1 DSGVO`, `Information under Art. ${article}(1) GDPR`),
				locale
			),
			rows: first
		},
		{
			id: 'abs2',
			title: text(
				L(`Angaben nach Art. ${article} Abs. 2 DSGVO`, `Information under Art. ${article}(2) GDPR`),
				locale
			),
			rows: second
		}
	];
}
