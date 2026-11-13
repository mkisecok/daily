import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tools } from './registry.js';

/** the rows of docs/legal-review.md, keyed by slug */
function reviewTable(): Map<string, { date: string; status: string }> {
	const rows = new Map<string, { date: string; status: string }>();
	for (const line of readFileSync('docs/legal-review.md', 'utf8').split('\n')) {
		const cells = line.split('|').map((cell) => cell.trim());
		const slug = /^`([a-z0-9-]+)`$/.exec(cells[2] ?? '')?.[1];
		if (slug) rows.set(slug, { date: cells[5], status: cells[8] });
	}
	return rows;
}

describe('legal review', () => {
	const table = reviewTable();
	const shown = tools.filter((tool) => tool.status !== 'planned');

	it('lists every tool in docs/legal-review.md', () => {
		expect(shown.map((tool) => tool.slug).filter((slug) => !table.has(slug))).toEqual([]);
	});

	it('keeps a reviewed date the same in the manifest and the table', () => {
		for (const tool of shown) {
			const row = table.get(tool.slug);
			if (tool.reviewedAt) expect(row?.date, tool.slug).toBe(tool.reviewedAt);
			else expect(row?.date, tool.slug).toBe('');
		}
	});

	it('marks no tool stable without a review', () => {
		expect(
			shown.filter((tool) => tool.status === 'stable' && !tool.reviewedAt).map((t) => t.slug)
		).toEqual([]);
	});
});
