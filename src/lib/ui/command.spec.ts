import { describe, expect, it } from 'vitest';
import { score } from './command.js';

const entries = [
	{ id: 'vvt', label: 'Verzeichnis von Verarbeitungstätigkeiten', keywords: ['Art. 30'] },
	{ id: 'datenpanne', label: 'Datenpanne', keywords: ['Art. 33', 'Meldung'] },
	{ id: 'dsfa', label: 'Datenschutz-Folgenabschätzung', keywords: ['Art. 35'] },
	{ id: 'avv', label: 'AVV-Prüfung', keywords: ['Auftragsverarbeitung', 'Daten'] }
];

/** what the palette shows: matches by descending score, ties in original order */
const ids = (query: string) =>
	entries
		.map((e, i) => ({ e, i, s: score(e.label, query, e.keywords) }))
		.filter((x) => x.s > 0)
		.sort((a, b) => b.s - a.s || a.i - b.i)
		.map((x) => x.e.id);

describe('command palette scoring', () => {
	it('shows everything in the original order for an empty query', () => {
		expect(ids('')).toEqual(['vvt', 'datenpanne', 'dsfa', 'avv']);
		expect(ids('   ')).toEqual(['vvt', 'datenpanne', 'dsfa', 'avv']);
	});

	it('ranks label prefixes before label matches before keyword matches', () => {
		expect(ids('daten')).toEqual(['datenpanne', 'dsfa', 'avv']);
		expect(ids('verarbeitung')).toEqual(['vvt', 'avv']);
	});

	it('ignores case, accents and ß', () => {
		expect(ids('FOLGENABSCHATZUNG')).toEqual(['dsfa']);
		expect(ids('prufung')).toEqual(['avv']);
	});

	it('matches keywords such as article numbers and nothing else', () => {
		expect(ids('art. 33')).toEqual(['datenpanne']);
		expect(ids('xyz')).toEqual([]);
	});
});
