import { describe, expect, it } from 'vitest';
import type { CellObject, Row } from 'write-excel-file/browser';
import { dsfaWorkbook } from './excel.js';

const record = {
	state: 'entwurf',
	data: {
		bezeichnung: 'Bewerbervorauswahl',
		vertraulichkeit_gefaehrdungen: ['G 0.14', 'G 0.23'],
		vertraulichkeit_w: '3',
		vertraulichkeit_s: '4',
		vertraulichkeit_begruendung: 'Bewerbungsunterlagen, viele Zugriffe',
		vertraulichkeit_massnahmen: 'Verschlüsselung',
		vertraulichkeit_rw: '2',
		vertraulichkeit_rs: '4',
		zweck_w: '2',
		zweck_s: '4',
		zweck_rw: '1',
		zweck_rs: '1'
	}
};

const cell = (row: Row, index: number) => row[index] as CellObject | null;
const values = (rows: Row[]) => rows.map((row) => row.map((c) => (c as CellObject | null)?.value));

describe('DSFA: Excel workbook', () => {
	const [overview, table, fields] = dsfaWorkbook(record, 'de');

	it('has an overview, the risk table and every field', () => {
		expect([overview.sheet, table.sheet, fields.sheet]).toEqual([
			'Übersicht',
			'Risikotabelle',
			'Angaben'
		]);
		expect(overview.orientation).toBe('landscape');
	});

	it('draws both matrices as coloured cells with the risk numbers', () => {
		const rows = values(overview.data);
		const start = rows.findIndex((row) => row[0] === 'Vor Abhilfemaßnahmen');
		expect(rows[start][6]).toBe('Nach Abhilfemaßnahmen (Restrisiko)');
		// severity "Groß" row: risks 1 and 5 at likelihood 3 and 2 before, 1 at 2 after
		const groß = overview.data[start + 1];
		expect(cell(groß, 0)?.value).toBe('Groß');
		expect(cell(groß, 2)?.value).toBe('5');
		expect(cell(groß, 3)?.value).toBe('1');
		expect(cell(groß, 2)?.backgroundColor).toBe('#B3191B');
		expect(cell(groß, 8)?.value).toBe('1');
		// "Geringfügig" row after measures: risk 5 at likelihood 1, a low cell
		const low = overview.data[start + 4];
		expect(cell(low, 7)?.value).toBe('5');
		expect(cell(low, 7)?.backgroundColor).toBe('#5A9A1A');
	});

	it('lists every risk with threats, ratings, reasons, levels and measures', () => {
		expect(table.data).toHaveLength(8);
		expect(values(table.data)[0]).toEqual([
			'#',
			'Risiko',
			'Gefährdungen',
			'Risiko im Einzelfall',
			'Eintrittswahrscheinlichkeit',
			'Schwere',
			'Begründung der Einstufung',
			'Vorher',
			'Abhilfemaßnahmen',
			'Wahrscheinlichkeit nach Maßnahmen',
			'Schwere nach Maßnahmen',
			'Nachher'
		]);
		expect(values(table.data)[1]).toEqual([
			1,
			'Unbefugte Offenlegung',
			'G 0.14, G 0.23',
			'—',
			3,
			4,
			'Bewerbungsunterlagen, viele Zugriffe',
			'Hohes Risiko',
			'Verschlüsselung',
			2,
			4,
			'Hohes Risiko'
		]);
		expect(values(table.data)[3]).toEqual([
			3,
			'Verlust oder Nichtverfügbarkeit',
			'—',
			'—',
			'—',
			'—',
			'—',
			'—',
			'—',
			'—',
			'—',
			'—'
		]);
	});

	it('adds the measures in place and the comparison when a TOM entry is linked', () => {
		const tom = { state: null, data: { vertraulichkeit_massnahmen: ['mfa'] } };
		const [, linked] = dsfaWorkbook(record, 'de', tom);
		const rows = values(linked.data);
		expect(rows[0].slice(-2)).toEqual(['Umgesetzte Maßnahmen (TOM)', 'Abgleich']);
		expect(rows[1].slice(-2)).toEqual(['Mehr-Faktor-Authentisierung', 'Maßnahmen umgesetzt']);
		expect(rows[5].slice(-2)).toEqual(['—', 'Senkung nicht belegt']);
		expect(linked.columns).toHaveLength(14);
		expect(values(table.data)[0]).toHaveLength(12);
	});

	it('names the consultation when a residual risk stays high', () => {
		const figures = values(overview.data).filter((row) => row[0] === 'Konsultation (Art. 36)');
		expect(figures[0][2]).toBe('Erforderlich');
	});
});
