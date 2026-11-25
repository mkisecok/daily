import { describe, expect, it } from 'vitest';
import { art30Links, art30Rows } from './print.js';

describe('VVT on paper', () => {
	it('lists Art. 30(1) b to g for a controller, gaps included', () => {
		const rows = art30Rows({ rolle: 'verantwortlicher', zwecke: 'Bewerbungen bearbeiten' }, 'de');
		// the DPIA line closes the table
		expect(rows.map((r) => r.letter)).toEqual(['b', '', 'c', 'c', 'd', 'e', 'f', 'g', '']);
		expect(rows[0].value).toBe('Bewerbungen bearbeiten');
		expect(rows.find((r) => r.letter === 'f')?.value).toBe('');
	});

	it('adds the joint controllers under a', () => {
		const rows = art30Rows({ rolle: 'gemeinsam', gemeinsam_mit: 'Muster AG' }, 'de');
		expect(rows[0]).toEqual({
			letter: 'a',
			label: 'Gemeinsam Verantwortliche',
			value: 'Muster AG'
		});
	});

	it('lists Art. 30(2) a to d for a processor', () => {
		const rows = art30Rows({ rolle: 'auftragsverarbeiter', auftraggeber: 'Kunde GmbH' }, 'de');
		expect(rows.map((r) => r.letter)).toEqual(['a', 'b', 'c', 'd']);
		expect(rows[0].value).toBe('Kunde GmbH');
	});

	it('writes the third-country transfer out', () => {
		const no = art30Rows({ rolle: 'verantwortlicher', drittland: false }, 'de');
		expect(no.find((r) => r.letter === 'e')?.value).toBe('Nein');
		const yes = art30Rows(
			{ rolle: 'verantwortlicher', drittland: true, drittland_details: 'USA' },
			'de'
		);
		expect(yes.find((r) => r.letter === 'e')?.value).toBe('Ja\nUSA');
	});

	it('shows the short description and the interfaces only when filled', () => {
		const label = (data: object) =>
			art30Rows({ rolle: 'verantwortlicher', ...data }, 'de').map((r) => r.label);
		expect(label({})).not.toContain('Kurzbeschreibung');
		const filled = art30Rows(
			{
				rolle: 'verantwortlicher',
				beschreibung: 'Erfassung im Personalsystem',
				schnittstellen: 'Export an das Lohnbüro'
			},
			'de'
		);
		expect(filled[0]).toEqual({
			letter: '',
			label: 'Kurzbeschreibung',
			value: 'Erfassung im Personalsystem'
		});
		expect(filled.find((r) => r.label === 'Schnittstellen und automatisierte Abrufe')?.value).toBe(
			'Export an das Lohnbüro'
		);
	});

	it('lists the processors, systems and DPIAs other tools link to the entry', () => {
		const links = art30Links(
			{
				avv: [{ title: 'Lohnbüro Muster GmbH', data: { sitz: 'eu' } }],
				tom: [{ title: 'Personalsystem', data: {} }],
				dsfa: [{ title: 'DSFA Lohnabrechnung', data: { freigegeben_am: '2026-10-01' } }]
			},
			'de'
		);
		expect(links).toEqual({
			processors: ['Lohnbüro Muster GmbH (EU/EWR)'],
			systems: ['Personalsystem'],
			dsfas: ['DSFA Lohnabrechnung (freigegeben am 01.10.2026)']
		});
		const rows = art30Rows(
			{ rolle: 'verantwortlicher', tom: 'Verschlüsselung', dsfa: 'durchgefuehrt' },
			'de',
			links
		);
		expect(rows.find((r) => r.letter === 'd')?.value).toBe(
			'Auftragsverarbeiter (AVV-Prüfung): Lohnbüro Muster GmbH (EU/EWR)'
		);
		expect(rows.find((r) => r.letter === 'g')?.value).toBe(
			'Verschlüsselung\nSysteme im TOM-Katalog: Personalsystem'
		);
		expect(rows.at(-1)).toEqual({
			letter: '',
			label: 'Datenschutz-Folgenabschätzung',
			value: 'Durchgeführt\nDSFA Lohnabrechnung (freigegeben am 01.10.2026)'
		});
		const processor = art30Rows({ rolle: 'auftragsverarbeiter' }, 'de', links);
		expect(processor.find((r) => r.letter === 'd')?.value).toBe(
			'Systeme im TOM-Katalog: Personalsystem'
		);
	});
});
