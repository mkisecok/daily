/**
 * checks whether the committed law texts are still the versions in force:
 * the newest consolidated version of each EU act in Cellar and the Stand of
 * each German statute on gesetze-im-internet.de. Read-only; it never
 * imports. Prints a Markdown report and exits with 1 when a version in
 * force changed, 2 when nothing changed but a source could not be read,
 * 0 otherwise (also when a version is only announced).
 *
 * `--eu-only` checks the EU acts alone: gesetze-im-internet.de refuses
 * GitHub-hosted runners, so the weekly workflow leaves BDSG and TDDDG to a
 * local run.
 *
 * Run: pnpm normen:check [--eu-only] [--out report.md]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { LAWS } from '../../src/lib/normen/laws.js';
import type { LawId, LawText } from '../../src/lib/normen/types.js';
import { compareLaw, report, type Finding, type Unreadable } from '../../src/lib/normen/watch.js';
import { lawsInUse } from '../../src/lib/tools/rechtsstand.js';
import { tools } from '../../src/lib/tools/registry.js';
import { consolidatedVersions, standOf, statuteXml } from './sources.js';

const EU: Partial<Record<LawId, string>> = { dsgvo: '32016R0679', 'ki-vo': '32024R1689' };
const DE: Partial<Record<LawId, string>> = { bdsg: 'bdsg_2018', tdddg: 'ttdsg' };

const committed = (id: LawId) =>
	JSON.parse(readFileSync(`src/lib/normen/data/${id}.json`, 'utf8')) as LawText;

async function published(id: LawId) {
	const original = EU[id];
	if (original) return { id, versions: await consolidatedVersions(original) };
	const path = DE[id];
	if (path) return { id, stand: standOf(await statuteXml(path)) };
	throw new Error(`${id}: no source`);
}

async function main(): Promise<number> {
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const euOnly = process.argv.includes('--eu-only');
	const checked = LAWS.filter((law) => !euOnly || law.id in EU);
	const skipped = LAWS.filter((law) => !checked.includes(law)).map((law) => law.id);
	const findings: Finding[] = [];
	const unreadable: Unreadable[] = [];
	// one source that cannot be read does not hide what the others say
	await Promise.all(
		checked.map(async (law) => {
			try {
				findings.push(...compareLaw(committed(law.id), await published(law.id), today));
			} catch (error) {
				const cause = error instanceof Error ? (error.cause ?? error) : error;
				unreadable.push({
					id: law.id,
					reason: cause instanceof Error ? cause.message : String(cause)
				});
			}
		})
	);
	const order = (id: LawId) => LAWS.findIndex((law) => law.id === id);
	findings.sort((a, b) => order(a.id) - order(b.id));
	unreadable.sort((a, b) => order(a.id) - order(b.id));

	const citing = (id: LawId) =>
		tools
			.filter((tool) => tool.status !== 'planned' && lawsInUse(tool).some((law) => law.id === id))
			.map((tool) => ({ slug: tool.slug, name: tool.name.de }));

	const text = report(findings, citing, unreadable, skipped);
	const out = process.argv.indexOf('--out');
	if (out > 0) writeFileSync(process.argv[out + 1], text);
	console.log(text);
	if (findings.some((f) => f.level === 'changed')) return 1;
	return unreadable.length > 0 ? 2 : 0;
}

try {
	process.exitCode = await main();
} catch (error) {
	console.error(error);
	process.exitCode = 2;
}
