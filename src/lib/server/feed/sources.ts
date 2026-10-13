import type { SourceDefinition } from './types.js';

/**
 * Publishers the worker polls. Verified 2026-10-13 unless noted. Adding a
 * source = adding a row here; the worker upserts it into `feed_sources`.
 */
export const SOURCES: SourceDefinition[] = [
	// ---------- EU: authorities and courts ----------
	{
		slug: 'edpb',
		name: 'EDSA / EDPB',
		kind: 'rss',
		url: 'https://www.edpb.europa.eu/feed/news_en',
		region: 'eu',
		tier: 1,
		lang: 'en'
	},
	{
		slug: 'curia-presse',
		name: 'EuGH Pressemitteilungen',
		kind: 'rss',
		url: 'https://curia.europa.eu/site/rss.jsp?lang=de&secondLang=en',
		region: 'eu',
		tier: 1,
		lang: 'de',
		filtered: true
	},

	// ---------- Germany: authorities ----------
	{
		slug: 'bfdi',
		name: 'BfDI',
		kind: 'rss',
		url: 'https://www.bfdi.bund.de/SiteGlobals/Functions/RSSFeed/Allgemein/rssnewsfeed.xml?nn=252136&archiv=true',
		region: 'de',
		tier: 1,
		lang: 'de'
	},
	{
		slug: 'dsk',
		name: 'Datenschutzkonferenz',
		kind: 'rss',
		url: 'https://www.datenschutzkonferenz-online.de/rss.xml',
		region: 'de',
		tier: 1,
		lang: 'de'
	},
	{
		slug: 'lfdi-bw',
		name: 'LfDI Baden-Württemberg',
		kind: 'rss',
		url: 'https://www.baden-wuerttemberg.datenschutz.de/feed/',
		region: 'land',
		tier: 1,
		lang: 'de'
	},

	// ---------- Germany: legal press ----------
	{
		slug: 'dr-datenschutz',
		name: 'Dr. Datenschutz',
		kind: 'rss',
		url: 'https://www.dr-datenschutz.de/feed/',
		region: 'de',
		tier: 2,
		lang: 'de'
	},
	{
		slug: 'netzpolitik',
		name: 'netzpolitik.org',
		kind: 'rss',
		url: 'https://netzpolitik.org/feed/',
		region: 'de',
		tier: 2,
		lang: 'de',
		filtered: true
	},
	{
		slug: 'heise',
		name: 'heise online',
		kind: 'rss',
		url: 'https://www.heise.de/rss/heise-atom.xml',
		region: 'de',
		tier: 2,
		lang: 'de',
		filtered: true
	}
];
