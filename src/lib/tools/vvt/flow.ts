import { formatValue } from '../../records/format.js';
import type { RecordData, RecordView } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import { text } from '../i18n.js';
import type { Localized } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** who handles the data, top to bottom */
export const LANES = [
	{ id: 'quelle', label: L('Herkunft', 'Source') },
	{ id: 'verantwortlicher', label: L('Verantwortlicher', 'Controller') },
	{ id: 'auftragsverarbeiter', label: L('Auftragsverarbeiter', 'Processors') },
	{ id: 'unterauftrag', label: L('Unterauftragsverarbeiter', 'Sub-processors') },
	{ id: 'empfaenger', label: L('Empfänger', 'Recipients') },
	{ id: 'drittland', label: L('Drittland', 'Third country') }
] as const;

/** the stages of the data's life, left to right, as the EDPB DPIA template (2026, 1.2) names them */
export const STAGES = [
	{ id: 'erhebung', label: L('Erhebung', 'Collection') },
	{ id: 'nutzung', label: L('Nutzung', 'Use') },
	{ id: 'speicherung', label: L('Speicherung', 'Storage') },
	{ id: 'weitergabe', label: L('Weitergabe', 'Sharing') },
	{ id: 'loeschung', label: L('Löschung', 'Deletion') }
] as const;

export type Lane = (typeof LANES)[number]['id'];
export type Stage = (typeof STAGES)[number]['id'];

/** `sensitive` marks Art. 9 or 10 data, `warn` something the records leave open */
export type Tone = 'sensitive' | 'warn';

export type FlowNode = {
	id: string;
	lane: Lane;
	stage: Stage;
	title: string;
	detail: string;
	tone?: Tone;
};

export type FlowEdge = { from: string; to: string; label?: string; tone?: 'warn' | 'transfer' };

export type DataFlow = {
	/** only the lanes something stands in */
	lanes: Lane[];
	nodes: FlowNode[];
	edges: FlowEdge[];
	/** what the VVT, AVV and TOM entries leave open or contradict */
	warnings: Localized[];
};

/** an entry with its title, as the store holds it */
export type Linked = RecordView & { title: string };

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const list = (data: RecordData, id: string) =>
	Array.isArray(data[id]) ? (data[id] as string[]) : [];

/** at most `max` characters, cut at a word */
export function shorten(value: string, max = 90): string {
	const flat = value.replace(/\s+/g, ' ').trim();
	if (flat.length <= max) return flat;
	const cut = flat.slice(0, max - 1);
	return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2)).trimEnd()} …`;
}

/** one name per line or semicolon, for sub-processors written as text */
function names(value: string): string[] {
	return value
		.split(/\n|;/)
		.map((line) => line.replace(/^[-–•*]\s*/, '').trim())
		.filter(Boolean);
}

/**
 * the way the data of one processing activity takes: where it comes from,
 * who uses and stores it, whom it goes to and when it is deleted. Built from
 * the VVT entry, the AVV entries and TOM entries that link to it; nothing is
 * drawn by hand, so the picture is only as complete as the entries.
 */
export function dataFlow(vvt: RecordView, avv: Linked[], tom: Linked[], locale: string): DataFlow {
	const data = vvt.data;
	const t = (value: Localized) => text(value, locale);
	const label = (id: string, value: unknown = data[id]) => {
		const field = fieldById(definition, id);
		return field ? formatValue(field, value as never, locale as never) : '';
	};
	const nodes: FlowNode[] = [];
	const edges: FlowEdge[] = [];
	const warnings: Localized[] = [];
	const add = (node: FlowNode) => nodes.push(node);

	// collection: from the data subjects, from others, or both
	const origin = str(data.herkunft);
	const subjects = label('betroffene');
	if (origin !== 'dritte') {
		add({
			id: 'betroffene',
			lane: 'quelle',
			stage: 'erhebung',
			title: t(L('Betroffene', 'Data subjects')),
			detail: subjects
		});
		edges.push({ from: 'betroffene', to: 'erhebung' });
	}
	if (origin === 'dritte' || origin === 'beides') {
		add({
			id: 'dritte',
			lane: 'quelle',
			stage: 'erhebung',
			title: t(L('Dritte', 'Others')),
			detail: shorten(str(data.quelle)) || t(L('Quelle nicht angegeben', 'Source not given')),
			tone: str(data.quelle) ? undefined : 'warn'
		});
		edges.push({ from: 'dritte', to: 'erhebung' });
	}
	const categories = list(data, 'datenkategorien');
	add({
		id: 'erhebung',
		lane: 'verantwortlicher',
		stage: 'erhebung',
		title: t(L('Erhebung', 'Collection')),
		detail: label('datenkategorien'),
		tone: categories.includes('art9') || categories.includes('art10') ? 'sensitive' : undefined
	});

	// use: the purposes, and decisions taken by machine
	const automated = data.automatisiert === true;
	add({
		id: 'nutzung',
		lane: 'verantwortlicher',
		stage: 'nutzung',
		title: t(L('Nutzung', 'Use')),
		detail: [
			shorten(str(data.zwecke), 80),
			automated ? t(L('Automatisierte Entscheidung', 'Automated decision')) : ''
		]
			.filter(Boolean)
			.join(' · '),
		tone: automated ? 'warn' : undefined
	});
	edges.push({ from: 'erhebung', to: 'nutzung' });

	// storage: the systems of the TOM entries that link to this activity
	add({
		id: 'speicherung',
		lane: 'verantwortlicher',
		stage: 'speicherung',
		title: t(L('Speicherung', 'Storage')),
		detail:
			tom.map((entry) => entry.title).join(', ') ||
			t(L('Kein System im TOM-Katalog verknüpft', 'No system linked in the TOM catalogue')),
		tone: tom.length === 0 ? 'warn' : undefined
	});
	edges.push({ from: 'nutzung', to: 'speicherung' });
	if (tom.length === 0) {
		warnings.push(
			L(
				'Kein Eintrag im TOM-Katalog verweist auf diese Tätigkeit; wo die Daten liegen, bleibt offen.',
				'No TOM catalogue entry refers to this activity; where the data is kept stays open.'
			)
		);
	}

	// processors from the AVV entries, and the sub-processors they name
	const abroad: string[] = [];
	avv.forEach((entry, index) => {
		const id = `avv-${index}`;
		const outside = entry.data.sitz === 'drittland';
		add({
			id,
			lane: 'auftragsverarbeiter',
			stage: 'nutzung',
			title: entry.title,
			detail: shorten(str(entry.data.leistung), 70),
			tone: outside ? 'warn' : undefined
		});
		edges.push({ from: 'nutzung', to: id });
		const chain = entry.data.genehmigung === 'einzeln' || entry.data.genehmigung === 'allgemein';
		const subs = names(str(entry.data.unterauftragnehmer));
		const shown = subs.slice(0, 3);
		shown.forEach((name, n) => {
			const sub = `${id}-sub-${n}`;
			add({
				id: sub,
				lane: 'unterauftrag',
				stage: 'nutzung',
				title: shorten(name, 40),
				detail: ''
			});
			edges.push({ from: id, to: sub });
		});
		if (subs.length > shown.length) {
			const more = `${id}-sub-more`;
			add({
				id: more,
				lane: 'unterauftrag',
				stage: 'nutzung',
				title: t(L(`${subs.length - shown.length} weitere`, `${subs.length - shown.length} more`)),
				detail: ''
			});
			edges.push({ from: id, to: more });
		}
		if (chain && subs.length === 0) {
			const unknown = `${id}-sub-unbenannt`;
			add({
				id: unknown,
				lane: 'unterauftrag',
				stage: 'nutzung',
				title: t(L('Nicht benannt', 'Not named')),
				detail: entry.title,
				tone: 'warn'
			});
			edges.push({ from: id, to: unknown, tone: 'warn' });
			warnings.push(
				L(
					`${entry.title}: Unterauftragsverarbeiter sind erlaubt, aber nicht benannt (EDPB-Stellungnahme 22/2024).`,
					`${entry.title}: sub-processors are allowed but not named (EDPB Opinion 22/2024).`
				)
			);
		}
		if (outside) abroad.push(entry.title);
	});

	// sharing: every recipient category but the processors, which have their own lane
	const recipients = list(data, 'empfaenger');
	for (const value of recipients.filter((r) => r !== 'auftragsverarbeiter')) {
		add({
			id: `empfaenger-${value}`,
			lane: 'empfaenger',
			stage: 'weitergabe',
			title: label('empfaenger', [value]),
			detail: ''
		});
		edges.push({ from: 'speicherung', to: `empfaenger-${value}` });
	}

	// third countries: the activity's own transfers, and processors working abroad
	const transfer = data.drittland === true;
	if (transfer || abroad.length > 0) {
		const bases = label('garantien');
		const unfounded = transfer && !bases;
		add({
			id: 'drittland',
			lane: 'drittland',
			stage: 'weitergabe',
			title: t(L('Drittland', 'Third country')),
			detail: [shorten(str(data.drittland_details), 60), ...abroad].filter(Boolean).join(' · '),
			tone: unfounded || (abroad.length > 0 && !transfer) ? 'warn' : undefined
		});
		if (transfer) {
			edges.push({
				from: 'speicherung',
				to: 'drittland',
				label: bases || t(L('ohne Grundlage', 'no basis')),
				tone: unfounded ? 'warn' : 'transfer'
			});
		}
		avv.forEach((entry, index) => {
			if (entry.data.sitz === 'drittland') {
				edges.push({ from: `avv-${index}`, to: 'drittland', tone: 'transfer' });
			}
		});
		if (unfounded) {
			warnings.push(
				L(
					'Übermittlung in ein Drittland ohne Grundlage nach Art. 45 bis 49.',
					'Transfer to a third country without a basis under Art. 45 to 49.'
				)
			);
		}
		if (abroad.length > 0 && !transfer) {
			warnings.push(
				L(
					`${abroad.join(', ')} verarbeitet auch in Drittländern, im VVT ist aber keine Übermittlung angegeben.`,
					`${abroad.join(', ')} also processes in third countries, but the record states no transfer.`
				)
			);
		}
	}

	// deletion
	const periods = str(data.loeschfristen);
	add({
		id: 'loeschung',
		lane: 'verantwortlicher',
		stage: 'loeschung',
		title: t(L('Löschung', 'Deletion')),
		detail: shorten(periods, 80) || t(L('Keine Fristen angegeben', 'No periods given')),
		tone: periods ? undefined : 'warn'
	});
	edges.push({ from: 'speicherung', to: 'loeschung' });
	if (!periods) {
		warnings.push(
			L(
				'Keine Löschfristen angegeben (Art. 30 Abs. 1 lit. f).',
				'No erasure periods given (Art. 30(1)(f)).'
			)
		);
	}

	// processors named in the record and in the AVV register should match
	const named = recipients.includes('auftragsverarbeiter');
	if (named && avv.length === 0) {
		warnings.push(
			L(
				'Im VVT sind Auftragsverarbeiter genannt, aber kein Eintrag der AVV-Prüfung verweist auf diese Tätigkeit.',
				'The record names processors, but no processor contract entry refers to this activity.'
			)
		);
	}
	if (!named && avv.length > 0) {
		warnings.push(
			L(
				'Einträge der AVV-Prüfung verweisen auf diese Tätigkeit, im VVT fehlt aber die Empfängerkategorie „Auftragsverarbeiter“.',
				'Processor contract entries refer to this activity, but the record lacks the recipient category "processors".'
			)
		);
	}

	const used = new Set(nodes.map((node) => node.lane));
	return {
		lanes: LANES.map((lane) => lane.id).filter((id) => used.has(id)),
		nodes,
		edges,
		warnings
	};
}

export type Box = FlowNode & { x: number; y: number; w: number; h: number };
export type Path = FlowEdge & { d: string; mid: { x: number; y: number } };

export type Layout = {
	width: number;
	height: number;
	/** where each lane starts and how tall it is */
	lanes: { id: Lane; y: number; h: number }[];
	boxes: Box[];
	paths: Path[];
};

/** sizes in pixels of the grid the diagram is drawn on */
export const GRID = { head: 124, col: 212, box: 156, h: 64, gap: 12, pad: 14, top: 34 };

/**
 * places each node in its lane and stage, stacking those that share a
 * cell, and draws the edges at right angles: across stages through a
 * channel before the target column, within a stage down the gutter to the
 * left of the boxes, so no edge crosses a box
 */
export function layout(flow: DataFlow): Layout {
	const { head, col, box, h, gap, pad, top } = GRID;
	const stage = new Map<string, number>(STAGES.map((s, i) => [s.id, i]));
	const lanes: Layout['lanes'] = [];
	const boxes = new Map<string, Box>();
	let y = top;
	for (const lane of flow.lanes) {
		const inLane = flow.nodes.filter((node) => node.lane === lane);
		const rows = Math.max(
			1,
			...STAGES.map((s) => inLane.filter((node) => node.stage === s.id).length)
		);
		const height = rows * h + (rows - 1) * gap + pad * 2;
		for (const s of STAGES) {
			inLane
				.filter((node) => node.stage === s.id)
				.forEach((node, row) => {
					boxes.set(node.id, {
						...node,
						x: head + stage.get(s.id)! * col + (col - box) / 2,
						y: y + pad + row * (h + gap),
						w: box,
						h
					});
				});
		}
		lanes.push({ id: lane, y, h: height });
		y += height;
	}

	const paths: Path[] = [];
	for (const edge of flow.edges) {
		const a = boxes.get(edge.from);
		const b = boxes.get(edge.to);
		if (!a || !b) continue;
		let d: string;
		let mid: Path['mid'];
		if (b.x > a.x) {
			const [x1, y1, x2, y2] = [a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2];
			if (Math.abs(y2 - y1) < 1) {
				d = `M${x1},${y1} H${x2}`;
				mid = { x: (x1 + x2) / 2, y: y1 };
			} else {
				// right angles through a channel just before the target column, shared by its arrows
				const channel = x2 - (col - box) / 4;
				d = `M${x1},${y1} H${channel} V${y2} H${x2}`;
				// a label of at most 34 characters ends just before the channel
				mid = { x: channel - 100, y: y2 };
			}
		} else {
			// within a stage along the gutter left of the boxes, so no box is crossed
			const gutter = a.x - (col - box) / 2 + 4;
			const [y1, y2] = [a.y + a.h / 2, b.y + b.h / 2];
			d = `M${a.x},${y1} H${gutter} V${y2} H${b.x}`;
			mid = { x: gutter, y: (y1 + y2) / 2 };
		}
		paths.push({ ...edge, d, mid });
	}

	return {
		width: head + STAGES.length * col,
		height: y,
		lanes,
		boxes: [...boxes.values()],
		paths
	};
}

const escape = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** a line of at most `max` characters per row, at most `rows` rows */
function wrap(value: string, max: number, rows: number): string[] {
	const out: string[] = [];
	let line = '';
	for (const word of value.split(' ')) {
		if ((line + ' ' + word).trim().length > max && line) {
			out.push(line);
			line = word;
		} else line = (line + ' ' + word).trim();
	}
	if (line) out.push(line);
	if (out.length > rows) {
		out.length = rows;
		out[rows - 1] = `${out[rows - 1].slice(0, max - 2)} …`;
	}
	return out;
}

/** the diagram as a standalone SVG on white, for slides and reports */
export function toSvg(flow: DataFlow, locale: string, title: string): string {
	const plan = layout(flow);
	const t = (value: Localized) => text(value, locale);
	const fill: Record<string, string> = { sensitive: '#fff4cf', warn: '#fde9e8' };
	const stroke: Record<string, string> = { sensitive: '#b08400', warn: '#a3161a' };
	const parts: string[] = [];
	const width = plan.width + 2;
	const height = plan.height + 28;
	parts.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Helvetica, Arial, sans-serif">`,
		`<title>${escape(title)}</title>`,
		`<rect width="100%" height="100%" fill="#ffffff"/>`,
		`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#4a4741"/></marker></defs>`
	);
	STAGES.forEach((stage, i) => {
		parts.push(
			`<text x="${GRID.head + i * GRID.col + GRID.col / 2}" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#4a4741">${escape(t(stage.label))}</text>`
		);
	});
	plan.lanes.forEach((lane, i) => {
		const name = LANES.find((l) => l.id === lane.id)!;
		parts.push(
			`<rect x="0" y="${lane.y}" width="${plan.width}" height="${lane.h}" fill="${i % 2 ? '#ffffff' : '#f7f4ee'}" stroke="#d9d2c5"/>`,
			`<text x="10" y="${lane.y + lane.h / 2 + 4}" font-size="11" font-weight="600" fill="#4a4741">${escape(t(name.label))}</text>`
		);
	});
	for (const path of plan.paths) {
		const color =
			path.tone === 'warn' ? '#a3161a' : path.tone === 'transfer' ? '#1e40af' : '#4a4741';
		parts.push(
			`<path d="${path.d}" fill="none" stroke="${color}" stroke-width="1.4"${path.tone === 'warn' ? ' stroke-dasharray="4 3"' : ''} marker-end="url(#arrow)"/>`
		);
		if (path.label) {
			parts.push(
				`<text x="${path.mid.x}" y="${path.mid.y - 4}" text-anchor="middle" font-size="9" fill="${color}">${escape(shorten(path.label, 34))}</text>`
			);
		}
	}
	for (const box of plan.boxes) {
		parts.push(
			`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="6" fill="${box.tone ? fill[box.tone] : '#ffffff'}" stroke="${box.tone ? stroke[box.tone] : '#8f8a80'}"/>`,
			`<text x="${box.x + 8}" y="${box.y + 16}" font-size="11" font-weight="600" fill="#1c1b19">${escape(shorten(box.title, 26))}</text>`
		);
		wrap(box.detail, 30, 3).forEach((line, n) => {
			parts.push(
				`<text x="${box.x + 8}" y="${box.y + 31 + n * 12}" font-size="9.5" fill="#4a4741">${escape(line)}</text>`
			);
		});
	}
	parts.push(
		`<text x="2" y="${height - 8}" font-size="9" fill="#6e6960">${escape(title)}</text>`,
		'</svg>'
	);
	return parts.join('\n');
}
