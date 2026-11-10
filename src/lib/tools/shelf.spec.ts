import { describe, expect, it } from 'vitest';
import { TOOL_ICONS } from './icons.js';
import { tools } from './registry.js';
import { migrate, remember, RENAMED, togglePin } from './shelf.js';

describe('remember', () => {
	it('puts the latest first without duplicates', () => {
		expect(remember(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
	});

	it('keeps at most four', () => {
		expect(remember(['a', 'b', 'c', 'd'], 'e')).toEqual(['e', 'a', 'b', 'c']);
	});
});

describe('togglePin', () => {
	it('adds at the end and removes again', () => {
		expect(togglePin(['a'], 'b')).toEqual(['a', 'b']);
		expect(togglePin(['a', 'b'], 'a')).toEqual(['b']);
	});
});

it('gives every tool its own icon', () => {
	for (const tool of tools) expect(TOOL_ICONS[tool.slug], tool.slug).toBeDefined();
});

describe('migrate', () => {
	it('moves renamed tools to their new slug and keeps the order', () => {
		expect(migrate(['vvt', 'anonymisierer', 'dsfa'])).toEqual(['vvt', 'pseudonymisierer', 'dsfa']);
	});

	it('does not list a tool twice when both slugs were stored', () => {
		expect(migrate(['pseudonymisierer', 'anonymisierer'])).toEqual(['pseudonymisierer']);
	});

	it('only renames to slugs that exist', () => {
		const slugs = new Set(tools.map((tool) => tool.slug));
		for (const [from, to] of Object.entries(RENAMED)) {
			expect(slugs.has(to), to).toBe(true);
			expect(slugs.has(from), from).toBe(false);
		}
	});
});
