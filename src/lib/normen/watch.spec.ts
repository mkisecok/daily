import { describe, expect, it } from 'vitest';
import type { LawText } from './types.js';
import { committedCelex, compareLaw, report } from './watch.js';

const eu = (celex: string): LawText => ({
	id: 'dsgvo',
	source: {
		de: {
			url: `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${celex}`,
			version: ''
		}
	},
	retrieved: '2026-11-10',
	chapters: [],
	provisions: []
});
const de = (version: string): LawText => ({
	id: 'bdsg',
	source: { de: { url: 'https://www.gesetze-im-internet.de/bdsg_2018/', version } },
	retrieved: '2026-11-10',
	chapters: [],
	provisions: []
});

describe('law watch', () => {
	it('reads the committed consolidated version from the link', () => {
		expect(committedCelex(eu('02016R0679-20160504'))).toBe('02016R0679-20160504');
		expect(committedCelex(de('Stand'))).toBeNull();
	});

	it('finds nothing when the newest version in force is the committed one', () => {
		const law = eu('02016R0679-20160504');
		expect(compareLaw(law, { id: 'dsgvo', versions: ['02016R0679-20160504'] }, '20261113')).toEqual(
			[]
		);
	});

	it('reports a newer version in force and one announced for later', () => {
		const findings = compareLaw(
			eu('02016R0679-20160504'),
			{
				id: 'dsgvo',
				versions: ['02016R0679-20160504', '02016R0679-20261101', '02016R0679-20270301']
			},
			'20261113'
		);
		expect(findings.map((f) => f.level)).toEqual(['changed', 'upcoming']);
		expect(findings[0].text).toContain('02016R0679-20261101 vom 01.11.2026');
		expect(findings[1].text).toContain('gilt ab dem 01.03.2027');
	});

	it('reports a new Stand of a German statute', () => {
		const law = de('Zuletzt geändert durch Art. 3 G v. 12.5.2026 I Nr. 139');
		expect(compareLaw(law, { id: 'bdsg', stand: law.source.de!.version }, '20261113')).toEqual([]);
		const findings = compareLaw(
			law,
			{ id: 'bdsg', stand: 'Zuletzt geändert durch Art. 1 G v. 1.10.2026 I Nr. 250' },
			'20261113'
		);
		expect(findings).toHaveLength(1);
		expect(findings[0].level).toBe('changed');
	});

	it('lists the tools that cite a changed law in the report', () => {
		const text = report([{ id: 'bdsg', level: 'changed', text: 'BDSG: neuer Stand.' }], () => [
			{ slug: 'vvt', name: 'Verzeichnis von Verarbeitungstätigkeiten' }
		]);
		expect(text).toContain('**Neu in Kraft:** BDSG: neuer Stand.');
		expect(text).toContain('BDSG: Verzeichnis von Verarbeitungstätigkeiten (`vvt`)');
		expect(report([], () => [])).toBe('Alle Gesetzestexte sind aktuell.\n');
	});
});
