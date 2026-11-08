import type { RecordView } from '../../records/types.js';
import { GOALS } from '../tom-katalog/definition.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the nine groups of operations of SDM V3.1a, D2.1, each in its life-cycle phase */
export const VORGAENGE = [
	{ id: 'sn', code: 'Sn', phase: 'kollektion', title: L('Sammeln', 'Collect') },
	{ id: 'ab', code: 'Ab', phase: 'bereithaltung', title: L('Aufbereiten', 'Prepare') },
	{ id: 'aw', code: 'Aw', phase: 'bereithaltung', title: L('Aufbewahren', 'Store') },
	{ id: 'ba', code: 'Ba', phase: 'nutzung', title: L('Bearbeiten', 'Edit') },
	{ id: 'bn', code: 'Bn', phase: 'nutzung', title: L('Benutzen', 'Use') },
	{ id: 'bt', code: 'Bt', phase: 'nutzung', title: L('Bereitstellen', 'Disclose') },
	{ id: 'zf', code: 'Zf', phase: 'nutzung', title: L('Zusammenführen', 'Combine') },
	{ id: 'es', code: 'Es', phase: 'nutzung', title: L('Einschränken', 'Restrict') },
	{ id: 'bs', code: 'Bs', phase: 'beseitigung', title: L('Beseitigen', 'Erase') }
] as const;

/** the four phases of the data life cycle, the coarser x axis for a normal risk */
export const PHASEN = [
	{ id: 'kollektion', title: L('Kollektion', 'Collection') },
	{ id: 'bereithaltung', title: L('Bereithaltung', 'Holding') },
	{ id: 'nutzung', title: L('Nutzung', 'Use') },
	{ id: 'beseitigung', title: L('Beseitigung', 'Disposal') }
] as const;

/** the three levels of SDM V3.1a, D2.3 */
export const EBENEN = [
	{ id: 'e1', n: 1, title: L('Fachverfahren', 'Business process') },
	{ id: 'e2', n: 2, title: L('Fachapplikation', 'Business application') },
	{ id: 'e3', n: 3, title: L('Infrastruktur', 'Infrastructure') }
] as const;

/** the seven protection goals, as the TOM catalogue names them */
export const ZIELE = GOALS.map((goal) => ({ id: goal.id, title: goal.title }));

/** how far a goal is met in one cell; `entfaellt` when the cell does not apply */
export type CellStatus = 'umgesetzt' | 'teilweise' | 'luecke' | 'offen' | 'entfaellt';

/** the status a level can be given; an unset level is `offen` */
export const LEVEL_STATUS: { value: Exclude<CellStatus, 'offen'>; label: Localized }[] = [
	{ value: 'umgesetzt', label: L('Umgesetzt', 'In place') },
	{ value: 'teilweise', label: L('Teilweise umgesetzt', 'Partly in place') },
	{ value: 'luecke', label: L('Lücke', 'Gap') },
	{ value: 'entfaellt', label: L('Nicht relevant', 'Not relevant') }
];

/** the worse status wins when cells are combined */
const WEIGHT: Record<CellStatus, number> = {
	entfaellt: 0,
	umgesetzt: 1,
	offen: 2,
	teilweise: 3,
	luecke: 4
};

export function worst(statuses: CellStatus[]): CellStatus {
	return statuses.reduce<CellStatus>((a, b) => (WEIGHT[b] > WEIGHT[a] ? b : a), 'entfaellt');
}

export type Axis = 'phasen' | 'vorgaenge';

/**
 * one column of the x axis: a group of operations with its code, or a phase
 * holding several, which is shown by its title
 */
export type Column = { id: string; code?: string; title: Localized; vorgaenge: string[] };

export function columns(axis: Axis): Column[] {
	if (axis === 'vorgaenge') {
		return VORGAENGE.map((v) => ({ id: v.id, code: v.code, title: v.title, vorgaenge: [v.id] }));
	}
	return PHASEN.map((p) => ({
		id: p.id,
		title: p.title,
		vorgaenge: VORGAENGE.filter((v) => v.phase === p.id).map((v) => v.id)
	}));
}

const list = (record: RecordView, id: string): string[] => {
	const value = record.data[id];
	return Array.isArray(value) ? value : [];
};

/** the operations the processing performs */
export const activeVorgaenge = (record: RecordView) => list(record, 'vorgaenge');

/** view (b): how a goal is met on one level */
export function levelStatus(record: RecordView, goal: string, level: string): CellStatus {
	const value = record.data[`${goal}_${level}`];
	return LEVEL_STATUS.some((s) => s.value === value) ? (value as CellStatus) : 'offen';
}

const LEVELS = EBENEN.map((e) => e.id);
const GOAL_IDS = ZIELE.map((z) => z.id);

/**
 * reads an entry once and judges its cells. A gap recorded for an operation
 * (view a) names no level, so it marks the levels not rated as in place; the
 * operation's row on the top face shows it either way.
 */
export function reader(record: RecordView) {
	const active = new Set(activeVorgaenge(record));
	const levels = new Map<string, CellStatus>(
		GOAL_IDS.flatMap((g) => LEVELS.map((l) => [`${g}_${l}`, levelStatus(record, g, l)] as const))
	);
	const gaps = new Map(GOAL_IDS.map((g) => [g, new Set(list(record, `${g}_luecken`))]));
	const level = (goal: string, l: string) => levels.get(`${goal}_${l}`) ?? 'offen';
	/** the operation applies to the goal: it is performed and some level is relevant */
	const applies = (vorgang: string, goal: string) =>
		active.has(vorgang) && LEVELS.some((l) => level(goal, l) !== 'entfaellt');
	/** a gap recorded for an operation and goal where the operation applies */
	const marked = (vorgang: string, goal: string) =>
		applies(vorgang, goal) && (gaps.get(goal)?.has(vorgang) ?? false);

	/** one cell of the cube: an operation on a level, judged by one goal */
	const cell = (vorgang: string, l: string, goal: string): CellStatus => {
		const status = level(goal, l);
		if (!active.has(vorgang) || status === 'entfaellt') return 'entfaellt';
		return marked(vorgang, goal) && status !== 'umgesetzt' ? 'luecke' : status;
	};
	/** view (a): an operation judged by one goal across its levels */
	const row = (vorgang: string, goal: string): CellStatus => {
		if (!applies(vorgang, goal)) return 'entfaellt';
		if (marked(vorgang, goal)) return 'luecke';
		return worst(LEVELS.map((l) => cell(vorgang, l, goal)));
	};
	return { level, applies, marked, cell, row };
}

/** one cell of the cube: an operation on a level, judged by one goal */
export const cell = (record: RecordView, vorgang: string, level: string, goal: string) =>
	reader(record).cell(vorgang, level, goal);

/** the cells of the full cube by status, over every operation, level and goal */
export function countCells(record: RecordView): Record<CellStatus, number> {
	const read = reader(record);
	const counts: Record<CellStatus, number> = {
		umgesetzt: 0,
		teilweise: 0,
		luecke: 0,
		offen: 0,
		entfaellt: 0
	};
	for (const v of VORGAENGE) {
		for (const l of LEVELS) for (const g of GOAL_IDS) counts[read.cell(v.id, l, g)]++;
	}
	return counts;
}

export type Cube = {
	axis: Axis;
	columns: Column[];
	/** view (a), the top face: [goal][column] */
	top: CellStatus[][];
	/** view (b), the side face: [goal][level], as assessed, before any operation is chosen */
	side: CellStatus[][];
	/** view (c), the front face: [level][column], over all goals or the chosen one */
	front: CellStatus[][];
	/** cells of the full cube by status, over every operation, level and goal */
	counts: Record<CellStatus, number>;
};

/**
 * the SDM cube of SDM V3.1a, D2.6, folded into its three faces: operations
 * × goals on top, levels × goals on the side, operations × levels in front.
 * A face cell takes the worst status of the cells behind it.
 */
export function buildCube(record: RecordView, axis: Axis, goal: string | null = null): Cube {
	const read = reader(record);
	const cols = columns(axis);
	const goals = goal ? [goal] : GOAL_IDS;
	return {
		axis,
		columns: cols,
		top: GOAL_IDS.map((g) => cols.map((c) => worst(c.vorgaenge.map((v) => read.row(v, g))))),
		side: GOAL_IDS.map((g) => LEVELS.map((l) => read.level(g, l))),
		front: LEVELS.map((l) =>
			cols.map((c) => worst(c.vorgaenge.flatMap((v) => goals.map((g) => read.cell(v, l, g)))))
		),
		counts: countCells(record)
	};
}

/** the default x axis: phases suffice for a normal risk, a high one needs all nine groups */
export const defaultAxis = (record: RecordView): Axis =>
	record.data.risikostufe === 'hoch' ? 'vorgaenge' : 'phasen';
