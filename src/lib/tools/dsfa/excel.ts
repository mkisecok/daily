import type { Cell, Row, Sheet } from 'write-excel-file/browser';
import { m } from '#lib/paraglide/messages.js';
import { formatValue } from '../../records/format.js';
import type { RecordView } from '../../records/types.js';
import { text } from '../i18n.js';
import {
	assessRisks,
	definition,
	RISKS,
	riskLevel,
	SCALE,
	type Rating,
	type RiskLevel
} from './definition.js';
import { engine } from './engine.js';
import { signOffChecks, type CheckStatus } from './signoff.js';
import { compareWithTom, type CoverageStatus } from './tom.js';

/** the DSK bands as Excel fills: strong for the matrix, soft for table cells */
const BAND: Record<RiskLevel, { fill: string; ink: string; soft: string; softInk: string }> = {
	gering: { fill: '#5A9A1A', ink: '#FFFFFF', soft: '#EEF6E4', softInk: '#3F6E10' },
	risiko: { fill: '#F2B700', ink: '#1C1B19', soft: '#FFF4CF', softInk: '#7A5A00' },
	hoch: { fill: '#B3191B', ink: '#FFFFFF', soft: '#FDE9E8', softInk: '#A3161A' }
};
const LEVEL: Record<RiskLevel, () => string> = {
	gering: m.risk_low,
	risiko: m.risk_mid,
	hoch: m.risk_high
};
const RULE = '#D9D2C5';
/** the label of a field every risk section shares, by its suffix, e.g. `w` */
const label = (suffix: string) =>
	text(RISKS[0].fields.find((field) => field.id === `${RISKS[0].id}_${suffix}`)!.label);

const head = (value: string): Cell => ({
	value,
	fontWeight: 'bold',
	backgroundColor: '#F1EEE6',
	bottomBorderColor: RULE,
	bottomBorderStyle: 'thin',
	wrap: true,
	alignVertical: 'center'
});
const title = (value: string, columnSpan = 1): Cell => ({
	value,
	fontWeight: 'bold',
	fontSize: 14,
	columnSpan
});
const pill = (level: RiskLevel | null): Cell =>
	level
		? {
				value: LEVEL[level](),
				backgroundColor: BAND[level].soft,
				textColor: BAND[level].softInk,
				fontWeight: 'bold',
				alignVertical: 'top'
			}
		: { value: '—', alignVertical: 'top' };
const top = (value: string | number): Cell => ({ value, wrap: true, alignVertical: 'top' });

/** one matrix as 4 × 4 coloured cells, severity from the top, the risk numbers in each cell */
function matrixRows(caption: string, ratings: { n: number; rating: Rating | null }[]): Row[] {
	const rows: Row[] = [[title(caption, 5), null, null, null, null]];
	for (const severity of [4, 3, 2, 1]) {
		const row: Row = [
			{ value: text(SCALE[severity - 1].label), align: 'right', alignVertical: 'center' }
		];
		for (const likelihood of [1, 2, 3, 4]) {
			const level = riskLevel(likelihood, severity);
			const here = ratings
				.filter(({ rating }) => rating?.likelihood === likelihood && rating.severity === severity)
				.map(({ n }) => n);
			row.push({
				value: here.join(', '),
				backgroundColor: BAND[level].fill,
				textColor: BAND[level].ink,
				fontWeight: 'bold',
				fontSize: 13,
				align: 'center',
				alignVertical: 'center',
				borderColor: '#1C1B19',
				borderStyle: 'thin',
				height: 42
			});
		}
		rows.push(row);
	}
	rows.push([
		{ value: `↑ ${m.dsfa_dash_severity()}`, fontSize: 9, align: 'right', wrap: true },
		...SCALE.map((step): Cell => ({
			value: text(step.label),
			align: 'center',
			fontSize: 9,
			wrap: true
		}))
	]);
	// the first cell stays a real (empty) cell: some viewers stop at a row that starts merged
	rows.push([
		{ value: '' },
		{ value: `${m.dsfa_dash_likelihood()} →`, columnSpan: 4, align: 'center', fontSize: 9 },
		null,
		null,
		null
	]);
	return rows;
}

const CHECK: Record<CheckStatus, { label: () => string; level: RiskLevel | null }> = {
	erfuellt: { label: m.dsfa_signoff_erfuellt, level: 'gering' },
	offen: { label: m.dsfa_signoff_offen, level: 'hoch' },
	entfaellt: { label: m.dsfa_signoff_entfaellt, level: null }
};

const STATUS: Record<CoverageStatus, () => string> = {
	abgedeckt: m.dsfa_tom_status_abgedeckt,
	luecke: m.dsfa_tom_status_luecke,
	unbelegt: m.dsfa_tom_status_unbelegt,
	offen: m.dsfa_tom_status_offen
};

/**
 * the DPIA as three sheets: an overview with key figures and both matrices,
 * the risk table, and every field of the entry. With the linked TOM entry,
 * the risk table also shows the measures in place per goal.
 */
export function dsfaWorkbook(
	record: RecordView,
	locale: string,
	tom: RecordView | null = null
): Sheet<Blob>[] {
	const coverage = tom ? compareWithTom(record, tom).goals : null;
	const risks = assessRisks(record).map((risk, index) => ({ ...risk, n: index + 1 }));
	const rated = risks.filter((risk) => risk.initial && risk.residual);
	const highBefore = risks.filter((risk) => risk.before === 'hoch').length;
	const highAfter = risks.filter((risk) => risk.after === 'hoch').length;
	const result = engine.assess?.(record) ?? null;
	const name = String(record.data[definition.titleField] ?? '');
	const value = (id: string) => {
		const raw = record.data[id];
		return typeof raw === 'string' && raw.trim() ? raw : '—';
	};

	const figure = (label: string, shown: string | number, level?: RiskLevel): Row => [
		{ value: label, columnSpan: 2 },
		null,
		level
			? { ...pill(level), value: shown, align: 'center' }
			: { value: shown, fontWeight: 'bold', align: 'center' }
	];

	const before = matrixRows(
		m.dsfa_dash_before(),
		rated.map((risk) => ({ n: risk.n, rating: risk.initial }))
	);
	const after = matrixRows(
		m.dsfa_dash_after(),
		rated.map((risk) => ({ n: risk.n, rating: risk.residual }))
	);

	const overview: Row[] = [
		[title(`${m.dsfa_xlsx_title()}: ${name}`, 11)],
		[
			{
				value: `${m.dsfa_xlsx_exported({ date: new Date().toLocaleDateString(locale) })} · ${m.dsfa_dash_source()}`,
				fontStyle: 'italic',
				textColor: '#6E6960',
				columnSpan: 11
			}
		],
		[],
		...(result
			? [
					[{ value: text(result.headline), fontWeight: 'bold', columnSpan: 11 }] as Row,
					[{ value: text(result.explanation), wrap: true, columnSpan: 11, height: 48 }] as Row,
					[] as Row
				]
			: []),
		figure(m.dsfa_dash_risks(), `${rated.length} / ${risks.length}`),
		figure(m.dsfa_dash_high_before(), highBefore, highBefore > 0 ? 'hoch' : 'gering'),
		figure(m.dsfa_dash_high_after(), highAfter, highAfter > 0 ? 'hoch' : 'gering'),
		figure(
			m.dsfa_dash_consult(),
			highAfter > 0 ? m.dsfa_dash_consult_yes() : m.dsfa_dash_consult_no(),
			highAfter > 0 ? 'hoch' : 'gering'
		),
		[],
		[title(m.dsfa_signoff_title(), 11)],
		...signOffChecks(record).map((check): Row => {
			const { label, level } = CHECK[check.status];
			const status: Cell = level
				? { ...pill(level), value: label(), align: 'center' }
				: { value: label(), align: 'center' };
			return [
				{ value: text(check.label), columnSpan: 2 },
				null,
				status,
				{
					value: [check.detail ? text(check.detail) : '', `${check.cite.ref} ${check.cite.law}`]
						.filter(Boolean)
						.join(' · '),
					textColor: '#6E6960',
					columnSpan: 8
				}
			];
		}),
		[],
		// the two matrices side by side, a spacer column between them
		...before.map((row, index): Row => [...row, null, ...after[index]]),
		[],
		[
			{ value: m.risk_low(), backgroundColor: BAND.gering.fill, textColor: BAND.gering.ink },
			{ value: m.risk_mid(), backgroundColor: BAND.risiko.fill, textColor: BAND.risiko.ink },
			{ value: m.risk_high(), backgroundColor: BAND.hoch.fill, textColor: BAND.hoch.ink }
		],
		[],
		...rated.map((risk): Row => [
			{ value: risk.n, align: 'right' },
			{ value: text(risk.title), columnSpan: 4 }
		])
	];

	const table: Row[] = [
		[
			head('#'),
			head(m.dsfa_dash_col_risk()),
			head(m.dsfa_dash_col_threats()),
			head(label('beschreibung')),
			head(label('w')),
			head(label('s')),
			head(label('begruendung')),
			head(m.dsfa_dash_col_before()),
			head(m.dsfa_dash_col_measures()),
			head(label('rw')),
			head(label('rs')),
			head(m.dsfa_dash_col_after()),
			...(coverage ? [head(m.dsfa_tom_col_measures()), head(m.dsfa_tom_col_status())] : [])
		],
		...risks.map((risk): Row => [
			top(risk.n),
			{ ...top(text(risk.title)), fontWeight: 'bold' },
			top(risk.threats.join(', ') || '—'),
			top(value(`${risk.id}_beschreibung`)),
			top(risk.initial ? risk.initial.likelihood : '—'),
			top(risk.initial ? risk.initial.severity : '—'),
			top(value(`${risk.id}_begruendung`)),
			pill(risk.before),
			top(value(`${risk.id}_massnahmen`)),
			top(risk.residual ? risk.residual.likelihood : '—'),
			top(risk.residual ? risk.residual.severity : '—'),
			pill(risk.after),
			...(coverage
				? [
						top(coverage[risk.n - 1].measures.map((measure) => text(measure)).join(', ') || '—'),
						top(STATUS[coverage[risk.n - 1].status]())
					]
				: [])
		])
	];

	const fields: Row[] = [[head(''), head(''), head('')]];
	for (const section of definition.sections) {
		fields.push([{ value: text(section.title), fontWeight: 'bold', fontSize: 12, columnSpan: 3 }]);
		for (const field of section.fields) {
			fields.push([
				top(text(field.label)),
				top(formatValue(field, record.data[field.id], locale) || '—'),
				top(field.cite ? `${field.cite.ref} ${field.cite.law}` : '')
			]);
		}
		fields.push([]);
	}
	fields.shift();

	return [
		{
			data: overview,
			sheet: m.dsfa_xlsx_sheet_overview(),
			orientation: 'landscape',
			showGridLines: false,
			columns: [
				{ width: 26 },
				...Array(4).fill({ width: 15 }),
				{ width: 3 },
				{ width: 26 },
				...Array(4).fill({ width: 15 })
			]
		},
		{
			data: table,
			sheet: m.dsfa_dash_table(),
			orientation: 'landscape',
			stickyRowsCount: 1,
			columns: [
				{ width: 4 },
				{ width: 28 },
				{ width: 18 },
				{ width: 34 },
				{ width: 13 },
				{ width: 10 },
				{ width: 34 },
				{ width: 15 },
				{ width: 40 },
				{ width: 13 },
				{ width: 10 },
				{ width: 15 },
				...(coverage ? [{ width: 40 }, { width: 20 }] : [])
			]
		},
		{
			data: fields,
			sheet: m.dsfa_xlsx_sheet_fields(),
			columns: [{ width: 38 }, { width: 70 }, { width: 24 }]
		}
	];
}

/** writes the workbook and offers it for download; loads the writer on demand */
export async function downloadDsfaWorkbook(
	record: RecordView,
	locale: string,
	filename: string,
	tom: RecordView | null = null
) {
	const { default: writeXlsxFile } = await import('write-excel-file/browser');
	await writeXlsxFile(dsfaWorkbook(record, locale, tom), {
		fontFamily: 'Calibri',
		fontSize: 11
	}).toFile(filename);
}
