/**
 * checks whether the committed law texts are still the versions in force:
 * the newest consolidated version of each EU act in Cellar and the Stand of
 * each German statute on gesetze-im-internet.de. Read-only; it never
 * imports. Prints a Markdown report and exits with 1 when a version in
 * force changed, 0 otherwise (also when one is only announced), and 2 when
 * a source could not be read.
 *
 * Run: pnpm normen:check [--out report.md]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { LAWS } from '../../src/lib/normen/laws.js';
import type { LawId, LawText } from '../../src/lib/normen/types.js';
import { compareLaw, report, type Published } from '../../src/lib/normen/watch.js';
import { lawsInUse } from '../../src/lib/tools/rechtsstand.js';
import { tools } from '../../src/lib/tools/registry.js';
import { consolidatedVersions, standOf, statuteXml } from './sources.js';

const EU: Partial<Record<LawId, string>> = { dsgvo: '32016R0679', 'ki-vo': '32024R1689' };
const DE: Partial<Record<LawId, string>> = { bdsg: 'bdsg_2018', tdddg: 'ttdsg' };

const committed = (id: LawId) =>
	JSON.parse(readFileSync(`src/lib/normen/data/${id}.json`, 'utf8')) as LawText;

async function published(id: LawId): Promise<Published> {
	const original = EU[id];
	if (original) return { id, versions: await consolidatedVersions(original) };
	const path = DE[id];
	if (path) return { id, stand: standOf(await statuteXml(path)) };
	throw new Error(`${id}: no source`);
}

async function main(): Promise<number> {
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const findings = (
		await Promise.all(
			LAWS.map(async (law) => compareLaw(committed(law.id), await published(law.id), today))
		)
	).flat();

	const citing = (id: LawId) =>
		tools
			.filter((tool) => tool.status !== 'planned' && lawsInUse(tool).some((law) => law.id === id))
			.map((tool) => ({ slug: tool.slug, name: tool.name.de }));

	const text = report(findings, citing);
	const out = process.argv.indexOf('--out');
	if (out > 0) writeFileSync(process.argv[out + 1], text);
	console.log(text);
	return findings.some((f) => f.level === 'changed') ? 1 : 0;
}

try {
	process.exitCode = await main();
} catch (error) {
	console.error(error);
	process.exitCode = 2;
}
