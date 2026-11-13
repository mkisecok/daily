import { LAWS } from './laws.js';
import type { LawId, LawText } from './types.js';

/**
 * compares the committed law data with what the sources publish today. No
 * network here: scripts/normen/check.ts fetches, this decides. Nothing is
 * changed automatically; a finding asks for a human review.
 */

/** what a source publishes: EU consolidated versions, or a statute's Stand */
export type Published = { id: LawId; versions: string[] } | { id: LawId; stand: string };

export type Finding = {
	id: LawId;
	/** `changed`: the version in force is newer than the data; `upcoming`: one is announced */
	level: 'changed' | 'upcoming';
	text: string;
};

const lawName = (id: LawId) => LAWS.find((law) => law.id === id)?.law ?? id;
const day = (yyyymmdd: string) =>
	`${yyyymmdd.slice(6)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(0, 4)}`;

/** the CELEX number of the committed consolidated version, from its EUR-Lex link */
export function committedCelex(law: LawText): string | null {
	return /CELEX:(0\d{4}R\d{4}-\d{8})/.exec(law.source.de?.url ?? '')?.[1] ?? null;
}

/** findings for one law; `today` as YYYYMMDD */
export function compareLaw(law: LawText, published: Published, today: string): Finding[] {
	const name = lawName(law.id);
	if ('stand' in published) {
		const committed = law.source.de?.version ?? '';
		return published.stand === committed
			? []
			: [
					{
						id: law.id,
						level: 'changed',
						text: `${name}: neuer Stand „${published.stand}“; eingepflegt ist „${committed}“.`
					}
				];
	}
	const committed = committedCelex(law);
	const date = (celex: string) => celex.slice(-8);
	const inForce = published.versions.filter((v) => date(v) <= today).sort();
	const upcoming = published.versions.filter((v) => date(v) > today).sort();
	const findings: Finding[] = [];
	const newest = inForce.at(-1);
	if (newest && newest !== committed) {
		findings.push({
			id: law.id,
			level: 'changed',
			text: `${name}: neue konsolidierte Fassung ${newest} vom ${day(date(newest))}; eingepflegt ist ${committed ?? 'keine'}.`
		});
	}
	for (const version of upcoming) {
		findings.push({
			id: law.id,
			level: 'upcoming',
			text: `${name}: Fassung ${version} angekündigt, gilt ab dem ${day(date(version))}.`
		});
	}
	return findings;
}

export type CitingTool = { slug: string; name: string };

/** a source that could not be read, with the reason */
export type Unreadable = { id: LawId; reason: string };

/** the report as Markdown, for the console and the issue body */
export function report(
	findings: Finding[],
	citing: (id: LawId) => CitingTool[],
	unreadable: Unreadable[] = [],
	/** laws this run leaves to a local check, e.g. statutes GitHub cannot reach */
	skipped: LawId[] = []
): string {
	const missing = [
		...unreadable.map(
			({ id, reason }) =>
				`- **Nicht geprüft:** ${lawName(id)}, die Quelle war nicht erreichbar (${reason}).`
		),
		...(skipped.length > 0
			? [
					`- ${skipped.map(lawName).join(', ')}: hier nicht geprüft; gesetze-im-internet.de ist von GitHub aus nicht erreichbar. Lokal: \`pnpm normen:check\`.`
				]
			: [])
	];
	if (findings.length === 0) {
		return missing.length === 0
			? 'Alle Gesetzestexte sind aktuell.\n'
			: `## Rechtsstand\n\n${missing.join('\n')}\n`;
	}
	const lines = ['## Rechtsstand', '', ...missing];
	for (const finding of findings) {
		lines.push(
			`- ${finding.level === 'changed' ? '**Neu in Kraft:**' : 'Angekündigt:'} ${finding.text}`
		);
	}
	const changed = [...new Set(findings.filter((f) => f.level === 'changed').map((f) => f.id))];
	if (changed.length > 0) {
		lines.push('', '## Betroffene Werkzeuge', '');
		for (const id of changed) {
			const tools = citing(id);
			lines.push(
				`- ${lawName(id)}: ${tools.length > 0 ? tools.map((t) => `${t.name} (\`${t.slug}\`)`).join(', ') : 'keines'}`
			);
		}
		lines.push(
			'',
			'## Nächste Schritte',
			'',
			'1. `pnpm normen:import`, dann den Diff je Vorschrift lesen.',
			'2. `src/lib/normen/versions.ts` anpassen; `versions.spec.ts` verlangt es.',
			'3. Die betroffenen Werkzeuge prüfen und den Rechtsstand in `docs/legal-review.md` vermerken.'
		);
	}
	return `${lines.join('\n')}\n`;
}
