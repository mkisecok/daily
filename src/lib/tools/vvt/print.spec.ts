import { describe, expect, it } from 'vitest';
import { art30Rows } from './print.js';

describe('VVT on paper', () => {
	it('lists Art. 30(1) b to g for a controller, gaps included', () => {
		const rows = art30Rows({ rolle: 'verantwortlicher', zwecke: 'Bewerbungen bearbeiten' }, 'de');
		expect(rows.map((r) => r.letter)).toEqual(['b', '', 'c', 'c', 'd', 'e', 'f', 'g']);
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
});
