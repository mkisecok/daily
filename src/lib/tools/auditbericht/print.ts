import { formatShortDate } from '../../i18n/date.js';
import type { PrintRow as HeadRow } from '../../print/meta.js';
import type { PrintPart, PrintRow } from '../../print/parts.js';
import { formatValue, stateLabel } from '../../records/format.js';
import type { Composed } from '../../records/links.js';
import type { RecordData, RecordToolDefinition, StoredRecord } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the order of findings in the report: the most serious first */
const SEVERITY = ['wesentlich', 'gering', 'hinweis', 'positiv'];

const day = (value: unknown, locale: string) =>
	typeof value === 'string' && value ? formatShortDate(value, locale) : '';

/**
 * the head of the report: the organisation, the report's title, whether it
 * is approved and who receives it, without Daily's own lines
 */
export function auditHead(
	record: StoredRecord,
	organisation: string | null | undefined,
	locale: string
): HeadRow[] {
	const t = (value: Localized) => text(value, locale);
	const data = record.data;
	const rows: HeadRow[] = [];
	if (organisation) rows.push({ label: t(L('Organisation', 'Organisation')), value: organisation });
	rows.push({ label: t(L('Bericht', 'Report')), value: record.title });
	const approved = day(data.freigegeben_am, locale);
	const by = typeof data.freigegeben_von === 'string' ? data.freigegeben_von : '';
	rows.push({
		label: t(L('Stand', 'Status')),
		value: approved
			? t(L(`Freigegeben am ${approved}`, `Approved on ${approved}`)) + (by ? `, ${by}` : '')
			: t(L('Entwurf', 'Draft')) +
				(day(data.erstellt_am, locale) ? `, ${day(data.erstellt_am, locale)}` : '')
	});
	if (typeof data.verteiler === 'string' && data.verteiler) {
		rows.push({ label: t(L('Verteiler', 'Distribution')), value: data.verteiler });
	}
	return rows;
}

/**
 * the audit report in the order of ISO 19011, 6.5.1: objectives, scope and
 * criteria, the team, the conclusion, the findings (the most serious first),
 * the checklists with their result, strengths and recommendations, and the
 * next audit. The audit and its findings and checklists come composed from
 * the report's `audit` field; without them those parts say so.
 */
export function auditParts(
	record: StoredRecord,
	composed: Composed[],
	locale: string
): PrintPart[] {
	const t = (value: Localized) => text(value, locale);
	const valueOf = (def: RecordToolDefinition, data: RecordData, id: string) => {
		const field = fieldById(def, id);
		return field ? formatValue(field, data[id], locale) : '';
	};
	const row = (label: Localized | string, value: string): PrintRow => ({
		letter: '',
		label: typeof label === 'string' ? label : t(label),
		value
	});
	const field = (def: RecordToolDefinition, data: RecordData, id: string) =>
		row(fieldById(def, id)!.label, valueOf(def, data, id));
	const lines = (...parts: [Localized, string][]) =>
		parts
			.filter(([, value]) => value)
			.map(([label, value]) => `${t(label)}: ${value}`)
			.join('\n');

	const report = record.data;
	const own = (id: string) => field(definition, report, id);
	const audit = composed.find((part) => part.tool.manifest.slug === 'auditprogramm');
	const group = (slug: string) =>
		audit?.backlinks.find((g) => g.tool.manifest.slug === slug) ?? null;
	const missing = row(L('Audit', 'Audit'), '');

	const scope: PrintRow[] = audit
		? (() => {
				const def = audit.tool.definition;
				const data = audit.record.data;
				const conducted = valueOf(def, data, 'durchgefuehrt_am');
				// an audit not yet carried out shows the day it is planned for
				const when = conducted
					? row(L('Durchgeführt am', 'Conducted on'), conducted)
					: row(L('Geplant am', 'Planned for'), valueOf(def, data, 'geplant_am'));
				return [
					row(L('Audit', 'Audit'), audit.record.title),
					field(def, data, 'art'),
					field(def, data, 'gegenstand'),
					row(
						L('Auditkriterien', 'Audit criteria'),
						[valueOf(def, data, 'kriterien'), valueOf(def, data, 'kriterien_details')]
							.filter(Boolean)
							.join('\n')
					),
					field(def, data, 'auditierte'),
					field(def, data, 'methoden'),
					when
				];
			})()
		: [missing];

	const team: PrintRow[] = audit
		? [
				field(audit.tool.definition, audit.record.data, 'auditoren'),
				field(audit.tool.definition, audit.record.data, 'unabhaengig'),
				field(audit.tool.definition, audit.record.data, 'ansprechpartner')
			]
		: [missing];

	const findings = group('feststellungen');
	const findingRows: PrintRow[] = [];
	if (findings && findings.records.length > 0) {
		const def = findings.tool.definition;
		const sorted = [...findings.records].sort(
			(a, b) =>
				SEVERITY.indexOf(String(a.data.kategorie)) - SEVERITY.indexOf(String(b.data.kategorie))
		);
		const counts = SEVERITY.map((category) => ({
			category,
			n: sorted.filter((f) => f.data.kategorie === category).length
		})).filter(({ n }) => n > 0);
		const option = fieldById(def, 'kategorie');
		findingRows.push(
			row(
				L('Übersicht', 'Overview'),
				counts
					.map(
						({ category, n }) =>
							`${n} × ${option ? formatValue(option, category, locale) : category}`
					)
					.join(', ')
			)
		);
		sorted.forEach((finding, index) => {
			const v = (id: string) => valueOf(def, finding.data, id);
			findingRows.push(
				row(
					`${index + 1}. ${finding.title}`,
					lines(
						[L('Einstufung', 'Classification'), v('kategorie')],
						[L('Anforderung', 'Requirement'), v('anforderung')],
						[L('Sachverhalt', 'Facts'), v('sachverhalt')],
						[L('Nachweis', 'Evidence'), v('nachweis')],
						[L('Korrekturmaßnahme', 'Corrective action'), v('massnahme')],
						[L('Verantwortlich', 'Responsible'), v('verantwortlich')],
						[L('Umsetzen bis', 'Implement by'), v('frist')],
						[L('Stand', 'Status'), finding.state ? stateLabel(def, finding.state, locale) : '']
					)
				)
			);
		});
	} else {
		findingRows.push(row(L('Feststellungen', 'Findings'), t(L('Keine.', 'None.'))));
	}

	const checklists = group('pruefkatalog');
	const checklistRows: PrintRow[] =
		checklists && checklists.records.length > 0
			? checklists.records.map((item) => {
					const def = checklists.tool.definition;
					const v = (id: string) => valueOf(def, item.data, id);
					return row(
						item.title,
						lines(
							[L('Bereich', 'Area'), v('bereich')],
							[L('Ergebnis', 'Result'), v('ergebnis')],
							[L('Bewertung', 'Assessment'), v('bewertung')]
						)
					);
				})
			: [row(L('Prüfkataloge', 'Checklists'), t(L('Keine angefügt.', 'None attached.')))];

	const next = audit ? valueOf(audit.tool.definition, audit.record.data, 'naechstes_audit') : '';

	return [
		{
			id: 'auftrag',
			title: t(L('1. Auditziel, Umfang und Kriterien', '1. Audit objective, scope and criteria')),
			rows: scope
		},
		{
			id: 'team',
			title: t(L('2. Auditteam und Beteiligte', '2. Audit team and auditees')),
			rows: team
		},
		{
			id: 'ergebnis',
			title: t(L('3. Gesamturteil', '3. Audit conclusion')),
			rows: [own('gesamturteil'), own('zusammenfassung')]
		},
		{ id: 'feststellungen', title: t(L('4. Feststellungen', '4. Findings')), rows: findingRows },
		{ id: 'pruefkatalog', title: t(L('5. Prüfkataloge', '5. Checklists')), rows: checklistRows },
		{
			id: 'empfehlungen',
			title: t(L('6. Stärken und Empfehlungen', '6. Strengths and recommendations')),
			rows: [
				own('staerken'),
				own('empfehlungen'),
				...(next ? [row(L('Nächstes Audit', 'Next audit'), next)] : [])
			]
		}
	];
}
