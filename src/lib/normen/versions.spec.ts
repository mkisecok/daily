import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { LawId, LawText } from './types.js';
import { LAW_VERSIONS, versionOfSource } from './versions.js';

const read = (id: LawId) =>
	JSON.parse(readFileSync(`src/lib/normen/data/${id}.json`, 'utf8')) as LawText;

describe('law versions', () => {
	it('match the imported data', () => {
		for (const id of Object.keys(LAW_VERSIONS) as LawId[]) {
			const source = read(id).source.de!;
			expect(versionOfSource(source), id).toEqual(LAW_VERSIONS[id]);
		}
	});

	it('read a CELEX date and a German amending act', () => {
		expect(
			versionOfSource({
				url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:02024R1689-20260727',
				version: ''
			})
		).toEqual({ kind: 'consolidated', asOf: '2026-07-27' });
		expect(
			versionOfSource({
				url: 'https://www.gesetze-im-internet.de/bdsg_2018/',
				version:
					'Zuletzt geändert durch Art. 3 G v. 12.5.2026 I Nr. 139; Änderung durch Art. 3 G v. 3.7.2026 I Nr. 199 textlich nachgewiesen'
			})
		).toEqual({ kind: 'amended', asOf: '2026-07-03' });
		expect(versionOfSource({ url: 'https://example.org', version: 'Fassung' })).toBeNull();
	});
});
