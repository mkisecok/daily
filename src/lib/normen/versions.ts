import type { LawId } from './types.js';

/**
 * the version of each imported law, small enough for the browser. EU acts
 * are dated by their consolidated version, German statutes by their latest
 * amending act. `versions.spec.ts` keeps this in step with the imported
 * data, so a new import that changes the version fails until it is updated
 * here.
 */
export type LawVersion = { kind: 'consolidated' | 'amended'; asOf: string };

export const LAW_VERSIONS: Record<LawId, LawVersion> = {
	dsgvo: { kind: 'consolidated', asOf: '2016-05-04' },
	'ki-vo': { kind: 'consolidated', asOf: '2026-07-27' },
	bdsg: { kind: 'amended', asOf: '2026-07-03' },
	tdddg: { kind: 'amended', asOf: '2026-03-10' }
};

const iso = (day: string, month: string, year: string) =>
	`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

/**
 * the version named by an imported source: the date in an EUR-Lex CELEX
 * number such as `02024R1689-20260727`, or the latest "G v. 3.7.2026" of a
 * gesetze-im-internet.de note: a "Hinweis" names an amendment already in
 * the text after the "Stand" of the last fully processed one
 */
export function versionOfSource(source: { url: string; version: string }): LawVersion | null {
	const celex = /CELEX:0\d{4}R\d{4}-(\d{4})(\d{2})(\d{2})/.exec(source.url);
	if (celex) return { kind: 'consolidated', asOf: `${celex[1]}-${celex[2]}-${celex[3]}` };
	const amended = [...source.version.matchAll(/G v\. (\d{1,2})\.(\d{1,2})\.(\d{4})/g)]
		.map((match) => iso(match[1], match[2], match[3]))
		.sort();
	const latest = amended.at(-1);
	return latest ? { kind: 'amended', asOf: latest } : null;
}
