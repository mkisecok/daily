/**
 * the parts of the law import that only discover what is published: the
 * consolidated versions of an EU act in Cellar and the Stand of a German
 * statute on gesetze-im-internet.de. Shared by import.ts and check.ts.
 */
import { inflateRawSync } from 'node:zlib';
import * as cheerio from 'cheerio';

export async function sparql(query: string): Promise<Record<string, string>[]> {
	const response = await fetch('https://publications.europa.eu/webapi/rdf/sparql', {
		method: 'POST',
		headers: {
			accept: 'application/sparql-results+json',
			'content-type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({ query })
	});
	if (!response.ok) throw new Error(`SPARQL: HTTP ${response.status}`);
	const json = (await response.json()) as {
		results: { bindings: Record<string, { value: string }>[] };
	};
	return json.results.bindings.map((row) =>
		Object.fromEntries(Object.entries(row).map(([key, cell]) => [key, cell.value]))
	);
}

/** the consolidated versions of an EU act, e.g. 02016R0679-20160504, oldest first */
export async function consolidatedVersions(original: string): Promise<string[]> {
	const prefix = `0${original.slice(1)}-`;
	const rows = await sparql(`PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?celex WHERE {
  ?w cdm:resource_legal_id_celex ?celex . FILTER(STRSTARTS(STR(?celex), "${prefix}"))
}`);
	return rows.map((r) => r.celex).sort();
}

/** the date of a consolidated version as YYYYMMDD */
export const versionDate = (celex: string) => celex.slice(-8);

export const clean = (text: string) =>
	text
		.replace(/[\u00a0\u2002-\u200b]/g, ' ')
		.replace(/[▼►]\s*[A-Z]\d*/g, '')
		.replace(/◄/g, '')
		.replace(/\s+/g, ' ')
		.trim();

/** the single XML file inside a gesetze-im-internet zip (local file header, deflate) */
function unzipFirst(zip: Buffer): string {
	if (zip.readUInt32LE(0) !== 0x04034b50) throw new Error('not a zip');
	const method = zip.readUInt16LE(8);
	const size = zip.readUInt32LE(18);
	const nameLength = zip.readUInt16LE(26);
	const extraLength = zip.readUInt16LE(28);
	const start = 30 + nameLength + extraLength;
	const data = zip.subarray(start, start + size);
	return (method === 8 ? inflateRawSync(data) : data).toString('utf8');
}

/**
 * the Stand of a statute, taken from the first norm that carries one:
 * "Stand" names the last amendment, "Hinweis" newer ones already in the text
 */
export function standOf($: cheerio.CheerioAPI): string {
	const stand: string[] = [];
	$('norm').each((_, norm) => {
		if (stand.length > 0) return false;
		$(norm)
			.children('metadaten')
			.find('standangabe')
			.each((__, entry) => {
				const kind = clean($(entry).children('standtyp').text());
				if (kind === 'Stand' || kind === 'Hinweis') {
					stand.push(clean($(entry).children('standkommentar').text()));
				}
			});
	});
	return stand.join('; ') || 'Fassung nach gesetze-im-internet.de';
}

/** fetch with a timeout, tried three times with a growing pause: the sources are slow at times */
async function patientFetch(url: string): Promise<Response> {
	let last: unknown;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			return await fetch(url, { signal: AbortSignal.timeout(30_000) });
		} catch (error) {
			last = error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 5_000));
		}
	}
	throw last;
}

/** the parsed XML of a statute on gesetze-im-internet.de, e.g. `bdsg_2018` */
export async function statuteXml(path: string): Promise<cheerio.CheerioAPI> {
	const response = await patientFetch(`https://www.gesetze-im-internet.de/${path}/xml.zip`);
	if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
	const xml = unzipFirst(Buffer.from(await response.arrayBuffer()));
	return cheerio.load(xml, { xml: true });
}
