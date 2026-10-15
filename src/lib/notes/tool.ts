import type { RecordTool, RecordToolDefinition } from '../records/types.js';

const L = (de: string, en: string) => ({ de, en });

export const NOTES = 'notizen';

/**
 * notes run on the records framework, so they are scoped to the active
 * organisation, keep a history and live in browser storage in the
 * preview. They are not part of the tool catalogue.
 */
export const definition: RecordToolDefinition = {
	slug: NOTES,
	version: 1,
	intro: L('', ''),
	sources: [],
	titleField: 'titel',
	sections: [
		{
			id: 'notiz',
			title: L('Notiz', 'Note'),
			fields: [
				{ id: 'titel', type: 'text', label: L('Titel', 'Title'), required: true, listColumn: true },
				{ id: 'tag', type: 'date', label: L('Tag', 'Day') },
				{ id: 'text', type: 'textarea', label: L('Text', 'Text') },
				{ id: 'schlagworte', type: 'text', label: L('Schlagworte', 'Tags') },
				{ id: 'quelle', type: 'text', label: L('Quelle', 'Source') }
			]
		}
	]
};

export const notes: RecordTool = {
	manifest: {
		slug: NOTES,
		category: 'datenschutz',
		status: 'stable',
		shape: 'register',
		version: definition.version,
		name: L('Notizen', 'Notes'),
		summary: L('', ''),
		legalBasis: []
	},
	definition,
	engine: {}
};

/** tags from the comma-separated field, trimmed and without duplicates */
export function tags(value: unknown): string[] {
	if (typeof value !== 'string') return [];
	return [
		...new Set(
			value
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
		)
	];
}

/** a source is a link when it is a web address or an internal path */
export function sourceHref(value: unknown): { href: string; external: boolean } | null {
	if (typeof value !== 'string') return null;
	if (/^https?:\/\//i.test(value)) return { href: value, external: true };
	if (/^\/(?!\/)/.test(value)) return { href: value, external: false };
	return null;
}
