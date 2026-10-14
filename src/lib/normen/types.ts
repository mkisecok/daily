export type LawId = 'dsgvo' | 'ki-vo' | 'bdsg' | 'tdddg';

export type Lang = 'de' | 'en';

/** One unit of text: a paragraph, a numbered item, with nested items. */
export type Block = { label?: string; text: string; children?: Block[] };

export type ProvisionKind = 'artikel' | 'paragraph' | 'erwaegungsgrund' | 'anhang';

export type Provision = {
	/** URL id: `art-5`, `p-26`, `erwg-12`, `anhang-iii`. */
	id: string;
	kind: ProvisionKind;
	/** `5`, `26`, `12`, `III` */
	number: string;
	title: Partial<Record<Lang, string>>;
	blocks: Partial<Record<Lang, Block[]>>;
	/** Index into `chapters`, for articles and paragraphs. */
	chapter?: number;
};

export type Chapter = { title: Partial<Record<Lang, string>> };

export type LawText = {
	id: LawId;
	/** What the text is and where it came from, per language. */
	source: Partial<Record<Lang, { url: string; version: string }>>;
	retrieved: string;
	chapters: Chapter[];
	provisions: Provision[];
};

/** A block as shown: its text split into plain parts and links to provisions. */
export type RenderedBlock = {
	label?: string;
	segments: { text: string; law?: LawId; id?: string }[];
	children?: RenderedBlock[];
};
