export type SourceKind = 'rss' | 'html';
export type Region = 'eu' | 'de' | 'land';

export type SourceDefinition = {
	slug: string;
	name: string;
	kind: SourceKind;
	url: string;
	region: Region;
	/** 1 = authority, court or legislator; 2 = legal press */
	tier: 1 | 2;
	lang: 'de' | 'en';
	/**
	 * general-interest publishers: keep only items that match at least one
	 * regulation keyword, otherwise the feed drowns in unrelated news.
	 */
	filtered?: boolean;
	/** HTML sources: CSS selectors for the list page */
	html?: {
		item: string;
		title: string;
		link: string;
		date: string;
		/** `dd.mm.yyyy` or `iso` */
		dateFormat: 'dmy' | 'iso';
	};
};

/** one normalised entry from any adapter, before tagging and storage */
export type RawItem = {
	url: string;
	title: string;
	excerpt?: string;
	publishedAt: Date;
};
