import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { definition } from './definition.js';
import { dataFlow, GRID, layout, shorten, toSvg, type Linked } from './flow.js';

const example = { state: null, data: definition.example as RecordData };
const entry = (title: string, data: RecordData): Linked => ({ state: null, title, data });

const payroll = entry('Lohnbüro Muster GmbH', {
	vvt: 'vvt-1',
	leistung: 'Lohnabrechnung',
	sitz: 'eu',
	genehmigung: 'allgemein',
	unterauftragnehmer: 'Rechenzentrum Frankfurt\nDruckdienst Köln'
});
const system = entry('Personalsystem', { vvt: 'vvt-1' });

describe('data flow of a VVT entry', () => {
	it('walks the stages from collection to deletion along the controller', () => {
		const flow = dataFlow(example, [payroll], [system], 'de');
		const controller = flow.nodes.filter((node) => node.lane === 'verantwortlicher');
		expect(controller.map((node) => node.stage)).toEqual([
			'erhebung',
			'nutzung',
			'speicherung',
			'loeschung'
		]);
		expect(flow.edges).toEqual(
			expect.arrayContaining([
				{ from: 'erhebung', to: 'nutzung' },
				{ from: 'nutzung', to: 'speicherung' },
				{ from: 'speicherung', to: 'loeschung' }
			])
		);
		expect(flow.nodes.find((node) => node.id === 'speicherung')?.detail).toBe('Personalsystem');
	});

	it('takes data from the subjects and from others, and shades special categories', () => {
		const flow = dataFlow(example, [], [], 'de');
		expect(flow.nodes.filter((node) => node.lane === 'quelle').map((node) => node.title)).toEqual([
			'Betroffene',
			'Dritte'
		]);
		expect(flow.nodes.find((node) => node.id === 'erhebung')?.tone).toBe('sensitive');
	});

	it('draws processors with their sub-processors and recipients by category', () => {
		const flow = dataFlow(example, [payroll], [system], 'de');
		expect(flow.nodes.filter((n) => n.lane === 'unterauftrag').map((n) => n.title)).toEqual([
			'Rechenzentrum Frankfurt',
			'Druckdienst Köln'
		]);
		expect(flow.nodes.filter((n) => n.lane === 'empfaenger').map((n) => n.title)).toEqual([
			'Interne Stellen',
			'Behörden und Sozialversicherungsträger',
			'Banken und Zahlungsdienstleister'
		]);
		expect(flow.lanes).toEqual([
			'quelle',
			'verantwortlicher',
			'auftragsverarbeiter',
			'unterauftrag',
			'empfaenger'
		]);
		expect(flow.warnings).toEqual([]);
	});

	it('warns where the entries leave the flow open or contradict each other', () => {
		const warnings = (vvt: RecordData, avv: Linked[] = [], tom: Linked[] = []) =>
			dataFlow({ state: null, data: vvt }, avv, tom, 'de')
				.warnings.map((w) => w.de)
				.join('\n');
		const bare = warnings({ empfaenger: ['auftragsverarbeiter'] });
		expect(bare).toContain('kein Eintrag der AVV-Prüfung');
		expect(bare).toContain('Kein Eintrag im TOM-Katalog');
		expect(bare).toContain('Keine Löschfristen');
		expect(warnings({ loeschfristen: 'x' }, [payroll], [system])).toContain(
			'fehlt aber die Empfängerkategorie'
		);
		const abroad = entry('Cloud Inc.', { sitz: 'drittland', genehmigung: 'allgemein' });
		const both = warnings(
			{ loeschfristen: 'x', empfaenger: ['auftragsverarbeiter'] },
			[abroad],
			[system]
		);
		expect(both).toContain('Cloud Inc. verarbeitet auch in Drittländern');
		expect(both).toContain('nicht benannt');
		expect(warnings({ loeschfristen: 'x', drittland: true }, [], [system])).toContain(
			'ohne Grundlage'
		);
	});

	it('marks a transfer with its basis and a missing basis as open', () => {
		const flow = dataFlow(
			{ state: null, data: { drittland: true, garantien: ['scc'], drittland_details: 'USA' } },
			[],
			[],
			'de'
		);
		expect(flow.edges.find((edge) => edge.to === 'drittland')).toMatchObject({
			tone: 'transfer',
			label: 'Standardvertragsklauseln (Art. 46 Abs. 2 lit. c)'
		});
		const open = dataFlow({ state: null, data: { drittland: true } }, [], [], 'de');
		expect(open.edges.find((edge) => edge.to === 'drittland')?.tone).toBe('warn');
	});

	it('speaks English when asked', () => {
		const flow = dataFlow(example, [], [], 'en');
		expect(flow.nodes.find((node) => node.id === 'loeschung')?.title).toBe('Deletion');
	});
});

describe('layout of the data flow', () => {
	const plan = layout(dataFlow(example, [payroll], [system], 'de'));

	it('puts each box in its stage column and stacks boxes that share a cell', () => {
		const box = (id: string) => plan.boxes.find((b) => b.id === id)!;
		expect(box('erhebung').x).toBe(GRID.head + (GRID.col - GRID.box) / 2);
		expect(box('loeschung').x).toBe(GRID.head + 4 * GRID.col + (GRID.col - GRID.box) / 2);
		const [first, second] = ['avv-0-sub-0', 'avv-0-sub-1'].map(box);
		expect(second.y - first.y).toBe(GRID.h + GRID.gap);
		expect(plan.width).toBe(GRID.head + 5 * GRID.col);
	});

	it('draws arrows at right angles, across stages through a channel and within a stage along the gutter', () => {
		const path = (from: string, to: string) =>
			plan.paths.find((p) => p.from === from && p.to === to)!.d;
		expect(path('erhebung', 'nutzung')).toMatch(/^M[\d.]+,[\d.]+ H[\d.]+$/);
		expect(path('speicherung', 'empfaenger-behoerden')).toMatch(
			/^M[\d.]+,[\d.]+ H[\d.]+ V[\d.]+ H[\d.]+$/
		);
		expect(path('avv-0', 'avv-0-sub-1')).toMatch(/^M[\d.]+,[\d.]+ H[\d.]+ V[\d.]+ H[\d.]+$/);
	});
});

describe('SVG export', () => {
	it('is a standalone SVG with the stages, lanes and escaped text', () => {
		const svg = toSvg(
			dataFlow({ state: null, data: { quelle: 'A & B <GmbH>', herkunft: 'dritte' } }, [], [], 'de'),
			'de',
			'Datenfluss: Test'
		);
		expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
		expect(svg).toContain('<title>Datenfluss: Test</title>');
		expect(svg).toContain('>Erhebung<');
		expect(svg).toContain('A &amp; B &lt;GmbH&gt;');
		expect(svg).not.toContain('<GmbH>');
	});

	it('shortens at a word', () => {
		expect(shorten('eins zwei drei vier', 12)).toBe('eins zwei …');
		expect(shorten('kurz', 12)).toBe('kurz');
	});
});
