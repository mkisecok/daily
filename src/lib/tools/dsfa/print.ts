import { formatShortDate } from '../../i18n/date.js';
import type { PrintRow as HeadRow } from '../../print/meta.js';
import type { PrintPart, PrintRow } from '../../print/parts.js';
import { formatValue, stateLabel, type Titles } from '../../records/format.js';
import type { RecordView, StoredRecord } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import {
	COMPLIANCE,
	SCALE,
	assessRisks,
	definition,
	type Rating,
	type RiskLevel
} from './definition.js';
import { signOffChecks } from './signoff.js';
import { threatById } from './threats.js';

const L = (de: string, en: string): Localized => ({ de, en });

const LEVEL: Record<RiskLevel, Localized> = {
	gering: L('Geringes Risiko', 'Low risk'),
	risiko: L('Risiko', 'Risk'),
	hoch: L('Hohes Risiko', 'High risk')
};

/**
 * the head of the report: the operation it assesses, its state, the day of
 * this version and the next review, without Daily's own lines
 */
export function dsfaHead(
	record: StoredRecord,
	organisation: string | null | undefined,
	locale: string
): HeadRow[] {
	const rows: HeadRow[] = [];
	if (organisation) {
		rows.push({ label: text(L('Verantwortlicher', 'Controller'), locale), value: organisation });
	}
	rows.push(
		{ label: text(L('Verarbeitungsvorgang', 'Processing operation'), locale), value: record.title },
		{
			label: text(L('Stand', 'Status'), locale),
			value: `${stateLabel(definition, record.state, locale)}, ${formatShortDate(record.updatedAt, locale)}`
		}
	);
	const review = record.data.ueberpruefung;
	if (typeof review === 'string' && review) {
		rows.push({
			label: text(L('Nächste Überprüfung', 'Next review'), locale),
			value: formatShortDate(review, locale)
		});
	}
	return rows;
}

/**
 * the DSFA as a report in the order of Art. 35 Abs. 7 DSGVO and DSK
 * Kurzpapier Nr. 5: subject and preparation, the description (lit. a),
 * necessity and proportionality (lit. b), the risks (lit. c), the measures
 * (lit. d), who was heard, and the outcome with the consultation under
 * Art. 36. Risks not rated are named in one line instead of empty rows.
 */
export function dsfaParts(record: RecordView, locale: string, titles: Titles = {}): PrintPart[] {
	const data = record.data;
	const t = (value: Localized) => text(value, locale);
	const value = (id: string) => {
		const field = fieldById(definition, id);
		return field ? formatValue(field, data[id], locale, titles) : '';
	};
	const row = (label: Localized | string, answer: string, letter = ''): PrintRow => ({
		letter,
		label: typeof label === 'string' ? label : t(label),
		value: answer
	});
	const field = (id: string, letter = '') => {
		const def = fieldById(definition, id)!;
		return row(def.label, value(id), letter);
	};
	const step = (n: number) => (SCALE[n - 1] ? t(SCALE[n - 1].label) : String(n));
	const rating = (r: Rating | null, level: RiskLevel | null) =>
		r && level
			? `${t(LEVEL[level])} (${t(L('Wahrscheinlichkeit', 'likelihood'))} ${step(r.likelihood)}, ${t(L('Schwere', 'severity'))} ${step(r.severity)})`
			: '';
	const lines = (...parts: [Localized, string][]) =>
		parts
			.filter(([, answer]) => answer)
			.map(([label, answer]) => `${t(label)}: ${answer}`)
			.join('\n');

	const risks = assessRisks(record);
	const rated = risks.filter((risk) => risk.before);
	const unrated = risks.filter((risk) => !risk.before);
	const threats = (ids: string[]) =>
		ids.map((id) => `${id} ${threatById(id) ? t(threatById(id)!.title) : ''}`.trim()).join('; ');
	const notRated: PrintRow[] =
		unrated.length > 0
			? [row(L('Nicht bewertet', 'Not rated'), unrated.map((risk) => t(risk.title)).join(', '))]
			: [];

	const screening = data.schwellwert;
	const screened =
		screening &&
		typeof screening === 'object' &&
		!Array.isArray(screening) &&
		'headline' in screening
			? t(screening.headline as Localized)
			: '';

	const checks = signOffChecks(record)
		.filter((check) => check.status !== 'entfaellt')
		.map((check) => {
			const status = check.status === 'erfuellt' ? L('erfüllt', 'met') : L('offen', 'open');
			const detail = check.detail ? ` (${t(check.detail)})` : '';
			return `${t(check.label)}: ${t(status)}${detail}`;
		})
		.join('\n');

	return [
		{
			id: 'gegenstand',
			title: t(L('1. Gegenstand und Vorbereitung', '1. Subject and preparation')),
			rows: [
				field('vvt'),
				field('umfang'),
				field('team'),
				row(L('Anlass der DSFA', 'Reason for the DPIA'), value('anlass') || screened)
			]
		},
		{
			id: 'beschreibung',
			title: t(
				L(
					'2. Systematische Beschreibung (Art. 35 Abs. 7 lit. a DSGVO)',
					'2. Systematic description (Art. 35(7)(a) GDPR)'
				)
			),
			rows: [field('verarbeitung'), field('zwecke'), field('akteure')]
		},
		{
			id: 'notwendigkeit',
			title: t(
				L(
					'3. Notwendigkeit und Verhältnismäßigkeit (Art. 35 Abs. 7 lit. b DSGVO)',
					'3. Necessity and proportionality (Art. 35(7)(b) GDPR)'
				)
			),
			rows: [
				field('notwendigkeit'),
				field('verhaeltnismaessigkeit'),
				field('rechtsgrundlagen'),
				field('rechtsgrundlagen_details'),
				...(data.besondere_kategorien === true ? [field('art9_ausnahme')] : []),
				...(data.automatisiert === true ? [field('art22_garantien')] : []),
				...(value('verhaltensregeln') ? [field('verhaltensregeln')] : []),
				row(
					L('Grundsätze und Betroffenenrechte', 'Principles and data subject rights'),
					lines(
						...COMPLIANCE.filter((item) => !item.when || item.when(data)).map(
							(item): [Localized, string] => [item.label, value(item.id)]
						)
					)
				),
				field('einhaltung_details')
			]
		},
		{
			id: 'risiken',
			title: t(
				L(
					'4. Risiken für die Rechte und Freiheiten (Art. 35 Abs. 7 lit. c DSGVO)',
					'4. Risks to rights and freedoms (Art. 35(7)(c) GDPR)'
				)
			),
			rows: [
				...rated.map((risk) =>
					row(
						risk.title,
						lines(
							[L('Einstufung', 'Rating'), rating(risk.initial, risk.before)],
							[L('Risiko im Einzelfall', 'Risk in this case'), value(`${risk.id}_beschreibung`)],
							[L('Gefährdungen', 'Threats'), threats(risk.threats)],
							[L('Begründung', 'Reasons'), value(`${risk.id}_begruendung`)]
						)
					)
				),
				...notRated
			]
		},
		{
			id: 'massnahmen',
			title: t(
				L(
					'5. Abhilfemaßnahmen und Restrisiko (Art. 35 Abs. 7 lit. d DSGVO)',
					'5. Measures and residual risk (Art. 35(7)(d) GDPR)'
				)
			),
			rows: [
				...rated.map((risk) =>
					row(
						risk.title,
						lines(
							[L('Maßnahmen', 'Measures'), value(`${risk.id}_massnahmen`)],
							[L('Nach Maßnahmen', 'After measures'), rating(risk.residual, risk.after)]
						)
					)
				),
				field('tom'),
				field('massnahmenplan'),
				field('massnahmen_bis')
			]
		},
		{
			id: 'beteiligung',
			title: t(L('6. Beteiligung', '6. Involvement')),
			rows: [field('dsb'), field('dsb_umsetzung'), field('standpunkt')]
		},
		{
			id: 'ergebnis',
			title: t(L('7. Ergebnis', '7. Outcome')),
			rows: [
				field('restrisiko'),
				field('umgesetzt'),
				row(
					L('Vor der Freigabe (DSK Kurzpapier Nr. 5)', 'Before sign-off (DSK Kurzpapier Nr. 5)'),
					checks
				),
				field('beschluss'),
				field('entscheidung'),
				row(
					L('Freigabe', 'Approval'),
					[value('freigegeben_von'), value('freigegeben_am')].filter(Boolean).join(', ')
				),
				...(value('konsultation_am') || value('stellungnahme')
					? [field('konsultation_am'), field('frist_verlaengert'), field('stellungnahme')]
					: [
							row(
								L(
									'Konsultation der Aufsichtsbehörde (Art. 36)',
									'Consultation of the authority (Art. 36)'
								),
								risks.some((risk) => risk.after === 'hoch')
									? t(L('Erforderlich, noch nicht erfolgt.', 'Required, not yet done.'))
									: t(
											L(
												'Nicht erforderlich: kein hohes Restrisiko.',
												'Not required: no high residual risk.'
											)
										)
							)
						]),
				field('ueberpruefung')
			]
		}
	];
}
