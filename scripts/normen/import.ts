/**
 * imports the law texts for the Normen-Navigator into src/lib/normen/data.
 *
 * DSGVO and KI-VO come from the EU Publications Office (Cellar): articles
 * and annexes from the consolidated version, recitals from the original
 * Official Journal text (consolidated texts omit recitals). BDSG and TDDDG
 * come from the XML of gesetze-im-internet.de. EU legislation may be
 * reused (Commission Decision 2011/833/EU); German statutes are not
 * protected by copyright (§ 5 UrhG).
 *
 * Run: pnpm normen:import
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import type {
	Block,
	Chapter,
	Lang,
	LawId,
	LawText,
	Provision
} from '../../src/lib/normen/types.js';
import { applyCorrections, recitalCorrections } from '../../src/lib/normen/corrigenda.js';

const OUT = 'src/lib/normen/data';
const CELLAR = 'https://publications.europa.eu/resource/celex/';
const retrieved = new Date().toISOString().slice(0, 10);

/**
 * the consolidated version is not pinned: the importer asks Cellar for the
 * newest one in force today, so a re-import picks up amendments. Recitals
 * come from the original act with the published corrigenda applied.
 */
type EuSource = { id: LawId; original: string };

const EU: EuSource[] = [
	{ id: 'dsgvo', original: '32016R0679' },
	{ id: 'ki-vo', original: '32024R1689' }
];

const DE: { id: LawId; path: string }[] = [
	{ id: 'bdsg', path: 'bdsg_2018' },
	{ id: 'tdddg', path: 'ttdsg' }
];

/** Cellar wants the brackets of corrigendum numbers such as 32016R0679R(02) encoded */
const celexUrl = (celex: string) => CELLAR + celex.replace(/\(/g, '%28').replace(/\)/g, '%29');

async function cellarOptional(celex: string, lang: Lang): Promise<string | null> {
	const response = await fetch(celexUrl(celex), {
		headers: { accept: 'application/xhtml+xml', 'accept-language': lang === 'de' ? 'deu' : 'eng' }
	});
	// corrigenda exist only in the languages they correct
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`${celex} ${lang}: HTTP ${response.status}`);
	return response.text();
}

async function cellar(celex: string, lang: Lang): Promise<string> {
	const html = await cellarOptional(celex, lang);
	if (html === null) throw new Error(`${celex} ${lang}: not found`);
	return html;
}

async function sparql(query: string): Promise<Record<string, string>[]> {
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

/** acts that amend or correct `original`, with their date as YYYYMMDD */
async function related(
	original: string,
	relation: 'amends' | 'corrects'
): Promise<{ celex: string; date: string }[]> {
	const rows = await sparql(`PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?celex ?date WHERE {
  ?t cdm:resource_legal_id_celex ?tc . FILTER(STR(?tc) = "${original}")
  ?w cdm:resource_legal_${relation}_resource_legal ?t ; cdm:resource_legal_id_celex ?celex ;
     cdm:work_date_document ?date .
}`);
	return rows
		.map((r) => ({ celex: r.celex, date: r.date.replace(/-/g, '') }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

async function consolidatedVersions(original: string): Promise<string[]> {
	const prefix = `0${original.slice(1)}-`;
	const rows = await sparql(`PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?celex WHERE {
  ?w cdm:resource_legal_id_celex ?celex . FILTER(STRSTARTS(STR(?celex), "${prefix}"))
}`);
	return rows.map((r) => r.celex).sort();
}

const versionDate = (celex: string) => celex.slice(-8);

/** "32026R1744" → "(EU) 2026/1744" with the kind of act per language */
function actName(celex: string, lang: Lang): string {
	const kind = celex[5] === 'L' ? ['Richtlinie', 'Directive'] : ['Verordnung', 'Regulation'];
	const number = `(EU) ${celex.slice(1, 5)}/${Number(celex.slice(6))}`;
	return `${kind[lang === 'de' ? 0 : 1]} ${number}`;
}

function longDate(yyyymmdd: string, lang: Lang): string {
	const date = new Date(
		`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}T12:00:00Z`
	);
	return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

const clean = (text: string) =>
	text
		.replace(/[\u00a0\u2002-\u200b]/g, ' ')
		.replace(/[▼►◄]\s*[A-Z]\d*/g, '')
		.replace(/\s+/g, ' ')
		.trim();

/** text lines of a corrigendum, one per paragraph or table cell */
function corrigendumLines(html: string): string[] {
	const $ = cheerio.load(html);
	$('p, div, td, br').before('\n');
	return $('body')
		.text()
		.split('\n')
		.map((line) => clean(line))
		.filter(Boolean);
}

/** block structure of EU (consolidated) markup: numbered paragraphs, grid lists, plain paragraphs */
function euBlocks($: cheerio.CheerioAPI, parent: AnyNode): Block[] {
	const out: Block[] = [];
	const merge = (label: string, inner: Block[]): Block =>
		inner.length > 0 && !inner[0].label
			? { label, text: inner[0].text, ...(inner.length > 1 ? { children: inner.slice(1) } : {}) }
			: { label, text: '', ...(inner.length > 0 ? { children: inner } : {}) };

	$(parent)
		.children()
		.each((_, node) => {
			const el = $(node);
			const cls = el.attr('class') ?? '';
			const tag = (node as Element).tagName;
			if (
				tag === 'hr' ||
				/title-article-norm|eli-title|title-annex|title-division|separator|modref|arrow|footnote|title-doc|title-fam/.test(
					cls
				)
			) {
				return;
			}
			if (el.is('div.norm') && el.children('span.no-parag').length > 0) {
				const label = clean(el.children('span.no-parag').first().text());
				const clone = el.clone();
				clone.children('span.no-parag').first().remove();
				out.push(merge(label, euBlocks($, clone[0])));
			} else if (el.hasClass('grid-container')) {
				const label = clean(el.children('.grid-list-column-1').text());
				out.push(merge(label, euBlocks($, el.children('.grid-list-column-2')[0])));
			} else if (tag === 'table') {
				el.find('tr').each((__, row) => {
					const cells = $(row)
						.find('td, th')
						.map((___, cell) => clean($(cell).text()))
						.get()
						.filter(Boolean);
					if (cells.length > 0) out.push({ text: cells.join(' · ') });
				});
			} else if (tag === 'p' || (tag === 'div' && el.children().length === 0)) {
				const text = clean(el.text());
				if (text) out.push({ text });
			} else {
				out.push(...euBlocks($, node));
			}
		});
	return out;
}

const ROMAN = /^[IVXLC]+$/;

function parseConsolidated(html: string) {
	const $ = cheerio.load(html);
	$('.modref, .arrow, .footnote').remove();
	const chapters: { title: string }[] = [];
	const articles: { number: string; title: string; blocks: Block[]; chapter?: number }[] = [];
	const annexes: { number: string; title: string; blocks: Block[] }[] = [];
	let pendingChapter: string | null = null;

	$('p.title-division-1, p.title-division-2, div.eli-subdivision, div[id^="anx_"]').each(
		(_, node) => {
			const el = $(node);
			const id = el.attr('id') ?? '';
			if (el.is('p.title-division-1')) {
				const text = clean(el.text());
				pendingChapter = /^(KAPITEL|CHAPTER)\b/i.test(text) ? text : null;
			} else if (el.is('p.title-division-2')) {
				if (pendingChapter) {
					chapters.push({ title: `${pendingChapter} – ${clean(el.text())}` });
					pendingChapter = null;
				}
			} else if (/^art_\d+[a-z]?$/.test(id)) {
				articles.push({
					number: id.slice(4),
					title: clean(el.find('.stitle-article-norm').first().text()),
					blocks: euBlocks($, node),
					chapter: chapters.length > 0 ? chapters.length - 1 : undefined
				});
			} else if (/^anx_[IVXLC]+$/.test(id)) {
				const number = id.slice(4);
				if (!ROMAN.test(number)) return;
				annexes.push({
					number,
					title: clean(el.find('.title-annex-2').first().text()),
					blocks: euBlocks($, node)
				});
			}
		}
	);
	return { chapters, articles, annexes };
}

function parseRecitals(html: string): Map<string, string> {
	const $ = cheerio.load(html);
	const recitals = new Map<string, string>();
	$('div[id^="rct_"]').each((_, node) => {
		const id = $(node).attr('id') ?? '';
		if (!/^rct_\d+$/.test(id)) return;
		const cells = $(node).find('td');
		const text = clean((cells.length > 1 ? cells.last() : $(node)).text());
		recitals.set(id.slice(4), text.replace(/^\(\d+\)\s*/, ''));
	});
	return recitals;
}

async function importEu(source: EuSource): Promise<LawText> {
	const today = retrieved.replace(/-/g, '');
	const versions = await consolidatedVersions(source.original);
	const inForce = versions.filter((v) => versionDate(v) <= today);
	const consolidated = inForce.at(-1);
	if (!consolidated) throw new Error(`${source.id}: no consolidated version`);
	const upcoming = versions.filter((v) => versionDate(v) > today);
	if (upcoming.length > 0) console.warn(`${source.id}: future versions not imported:`, upcoming);

	const [consDe, consEn, origDe, origEn, amendments, corrigenda] = await Promise.all([
		cellar(consolidated, 'de'),
		cellar(consolidated, 'en'),
		cellar(source.original, 'de'),
		cellar(source.original, 'en'),
		related(source.original, 'amends'),
		related(source.original, 'corrects')
	]);
	const de = parseConsolidated(consDe);
	const en = parseConsolidated(consEn);
	const enArticles = new Map(en.articles.map((a) => [a.number, a]));
	const enAnnexes = new Map(en.annexes.map((a) => [a.number, a]));
	const recitalsDe = parseRecitals(origDe);
	const recitalsEn = parseRecitals(origEn);
	const corrected: Record<Lang, string[]> = { de: [], en: [] };
	for (const { celex } of corrigenda) {
		for (const [lang, recitals] of [
			['de', recitalsDe],
			['en', recitalsEn]
		] as const) {
			const html = await cellarOptional(celex, lang);
			if (html === null) continue;
			const applied = applyCorrections(
				recitals,
				recitalCorrections(corrigendumLines(html)),
				`${celex} ${lang}`
			);
			if (applied > 0) corrected[lang].push(celex);
			console.log(source.id, celex, lang, applied, 'recital corrections');
		}
	}
	const date = versionDate(consolidated);
	// an amendment published after the version date is not in this text yet
	const amended = amendments.filter((a) => a.date <= date).map((a) => a.celex);
	const version = (lang: Lang) => {
		const parts =
			lang === 'de'
				? [
						`Konsolidierte Fassung vom ${longDate(date, lang)}`,
						amended.length > 0
							? `geändert durch ${amended.map((a) => actName(a, lang)).join(', ')}`
							: '',
						corrected.de.length > 0
							? 'Erwägungsgründe aus dem Amtsblatt, Berichtigungen eingearbeitet'
							: 'Erwägungsgründe aus dem Amtsblatt'
					]
				: [
						`Consolidated version of ${longDate(date, lang)}`,
						amended.length > 0
							? `amended by ${amended.map((a) => actName(a, lang)).join(', ')}`
							: '',
						corrected.en.length > 0
							? 'recitals from the Official Journal, corrigenda applied'
							: 'recitals from the Official Journal'
					];
		return parts.filter(Boolean).join('; ');
	};

	const provisions: Provision[] = [
		...de.articles.map((a) => ({
			id: `art-${a.number}`,
			kind: 'artikel' as const,
			number: a.number,
			title: { de: a.title, en: enArticles.get(a.number)?.title },
			blocks: { de: a.blocks, en: enArticles.get(a.number)?.blocks },
			chapter: a.chapter
		})),
		...de.annexes.map((a) => ({
			id: `anhang-${a.number.toLowerCase()}`,
			kind: 'anhang' as const,
			number: a.number,
			title: { de: a.title, en: enAnnexes.get(a.number)?.title },
			blocks: { de: a.blocks, en: enAnnexes.get(a.number)?.blocks }
		})),
		...[...recitalsDe].map(([number, text]) => ({
			id: `erwg-${number}`,
			kind: 'erwaegungsgrund' as const,
			number,
			title: {},
			blocks: {
				de: [{ text }],
				en: recitalsEn.has(number) ? [{ text: recitalsEn.get(number)! }] : undefined
			}
		}))
	];
	const chapters: Chapter[] = de.chapters.map((c, i) => ({
		title: { de: c.title, en: en.chapters[i]?.title }
	}));
	return {
		id: source.id,
		source: {
			de: {
				url: `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:${consolidated}`,
				version: version('de')
			},
			en: {
				url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${consolidated}`,
				version: version('en')
			}
		},
		retrieved,
		chapters,
		provisions
	};
}

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

/** block structure of gii-norm XML: P paragraphs with "(1)" labels, DL lists */
function giiBlocks($: cheerio.CheerioAPI, parent: AnyNode): Block[] {
	const out: Block[] = [];
	$(parent)
		.children()
		.each((_, node) => {
			const el = $(node);
			const tag = (node as Element).tagName.toLowerCase();
			if (tag === 'p') {
				const clone = el.clone();
				clone.find('DL').remove();
				const raw = clean(clone.text());
				const match = /^(\(\d+[a-z]?\))\s*(.*)$/s.exec(raw);
				const lists = el
					.children('DL')
					.toArray()
					.flatMap((dl) => giiList($, dl));
				const block: Block = match ? { label: match[1], text: match[2] } : { text: raw };
				if (lists.length > 0) block.children = lists;
				if (block.text || block.children) out.push(block);
			} else if (tag === 'dl') {
				out.push(...giiList($, node));
			} else if (tag !== 'table') {
				out.push(...giiBlocks($, node));
			}
		});
	return out;
}

function giiList($: cheerio.CheerioAPI, dl: AnyNode): Block[] {
	const items: Block[] = [];
	$(dl)
		.children('DT')
		.each((_, dt) => {
			const dd = $(dt).next('DD');
			const clone = dd.clone();
			clone.find('DL').remove();
			const nested = dd
				.find('> LA > DL, > DL')
				.toArray()
				.flatMap((inner) => giiList($, inner));
			items.push({
				label: clean($(dt).text()),
				text: clean(clone.text()),
				...(nested.length ? { children: nested } : {})
			});
		});
	return items;
}

async function importDe(law: { id: LawId; path: string }): Promise<LawText> {
	const response = await fetch(`https://www.gesetze-im-internet.de/${law.path}/xml.zip`);
	if (!response.ok) throw new Error(`${law.id}: HTTP ${response.status}`);
	const xml = unzipFirst(Buffer.from(await response.arrayBuffer()));
	const $ = cheerio.load(xml, { xml: true });
	const chapters: Chapter[] = [];
	const provisions: Provision[] = [];
	const stand: string[] = [];

	$('norm').each((_, norm) => {
		const meta = $(norm).children('metadaten');
		const unit = meta.children('gliederungseinheit');
		const enbez = clean(meta.children('enbez').text());
		// "Stand" names the last amendment, "Hinweis" newer ones already in the text
		if (stand.length === 0) {
			meta.find('standangabe').each((__, entry) => {
				const kind = clean($(entry).children('standtyp').text());
				if (kind === 'Stand' || kind === 'Hinweis') {
					stand.push(clean($(entry).children('standkommentar').text()));
				}
			});
		}
		if (unit.length > 0) {
			chapters.push({
				title: {
					de: `${clean(unit.children('gliederungsbez').text())} – ${clean(unit.children('gliederungstitel').text())}`
				}
			});
		} else if (/^§\s*\d+[a-z]?$/.test(enbez)) {
			const number = enbez.replace(/^§\s*/, '');
			const content = $(norm).find('textdaten > text > Content').first();
			provisions.push({
				id: `p-${number}`,
				kind: 'paragraph',
				number,
				title: { de: clean(meta.children('titel').text()) },
				blocks: { de: content.length > 0 ? giiBlocks($, content[0]) : [] },
				chapter: chapters.length > 0 ? chapters.length - 1 : undefined
			});
		}
	});
	return {
		id: law.id,
		source: {
			de: {
				url: `https://www.gesetze-im-internet.de/${law.path}/`,
				version: stand.join('; ') || 'Fassung nach gesetze-im-internet.de'
			}
		},
		retrieved,
		chapters,
		provisions
	};
}

mkdirSync(OUT, { recursive: true });
for (const source of EU) {
	const law = await importEu(source);
	writeFileSync(`${OUT}/${law.id}.json`, JSON.stringify(law));
	console.log(law.id, law.provisions.length, 'provisions,', law.chapters.length, 'chapters');
}
for (const source of DE) {
	const law = await importDe(source);
	writeFileSync(`${OUT}/${law.id}.json`, JSON.stringify(law));
	console.log(law.id, law.provisions.length, 'provisions,', law.chapters.length, 'chapters');
}
