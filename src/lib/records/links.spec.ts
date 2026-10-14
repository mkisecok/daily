import { describe, expect, it } from 'vitest';
import { testTool } from './fixtures.js';
import { createLinks, referenceFields } from './links.js';
import { createBrowserStore } from './store/browser.js';
import type { RecordTool } from './types.js';
import { validateRecord } from './validate.js';

const L = (de: string) => ({ de, en: de });

/** A tool whose records point to records of the test tool. */
const noteTool: RecordTool = {
	manifest: { ...testTool.manifest, slug: 'notes', shape: 'register' },
	definition: {
		slug: 'notes',
		version: 1,
		intro: L(''),
		sources: [],
		titleField: 'title',
		composes: ['target'],
		sections: [
			{
				id: 'main',
				title: L('Main'),
				fields: [
					{ id: 'title', type: 'text', label: L('Titel'), required: true },
					{ id: 'target', type: 'reference', tool: 'test-register', label: L('Bezug') }
				]
			}
		]
	},
	engine: {}
};
const tools = [testTool, noteTool];

function setup() {
	const items = new Map<string, string>();
	let n = 0;
	const store = createBrowserStore(
		{
			getItem: (k) => items.get(k) ?? null,
			setItem: (k, v) => void items.set(k, v),
			removeItem: (k) => void items.delete(k)
		},
		{ getTool: (slug) => tools.find((t) => t.manifest.slug === slug), newId: () => `id-${++n}` }
	);
	return { store, links: createLinks(store, tools) };
}

describe('record links', () => {
	it('validates reference fields as record ids', () => {
		expect(referenceFields(noteTool.definition).map((f) => f.id)).toEqual(['target']);
		expect(validateRecord(noteTool.definition, { title: 'x', target: 'id-1' }).data.target).toBe(
			'id-1'
		);
		expect(validateRecord(noteTool.definition, { title: 'x', target: 42 }).errors.target).toBe(
			'invalid'
		);
	});

	it('offers the target records as choices and resolves their titles', async () => {
		const { store, links } = setup();
		await store.create('test-register', { name: 'Audit A' });
		await store.create('test-register', { name: 'Audit B' });
		const choices = await links.choices(noteTool.definition);
		expect(choices.target.map((o) => o.label.de).sort()).toEqual(['Audit A', 'Audit B']);
		expect(Object.values(await links.titles(noteTool.definition)).sort()).toEqual([
			'Audit A',
			'Audit B'
		]);
	});

	it('finds the records that point to a record', async () => {
		const { store, links } = setup();
		const a = await store.create('test-register', { name: 'Audit A' });
		const b = await store.create('test-register', { name: 'Audit B' });
		if (!a.ok || !b.ok) throw new Error('create failed');
		await store.create('notes', { title: 'Zu A', target: a.value.id });
		await store.create('notes', { title: 'Auch zu A', target: a.value.id });
		await store.create('notes', { title: 'Zu B', target: b.value.id });
		const back = await links.backlinks('test-register', a.value.id);
		expect(back.map((g) => g.tool.manifest.slug)).toEqual(['notes']);
		expect(back[0].records.map((r) => r.title).sort()).toEqual(['Auch zu A', 'Zu A']);
		expect(await links.backlinks('notes', 'id-x')).toEqual([]);
	});
});
