import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { buildCube, cell, columns, defaultAxis, worst, ZIELE } from './cube.js';
import { definition, REQUIREMENTS } from './definition.js';
import { engine } from './engine.js';

const view = (data: RecordData) => ({ state: null, data: validateRecord(definition, data).data });

/** every goal in place on every level */
const allMet: RecordData = Object.fromEntries(
	ZIELE.flatMap((z) => ['e1', 'e2', 'e3'].map((l) => [`${z.id}_${l}`, 'umgesetzt']))
);
const base: RecordData = {
	bezeichnung: 'Bewerbermanagement',
	risikostufe: 'normal',
	vorgaenge: ['sn', 'aw', 'bn', 'bt', 'bs'],
	vvt: 'vvt-1',
	tom: 'tom-1',
	...allMet
};
const assess = (data: RecordData) => engine.assess!(view(data))!;

describe('SDM cube: model', () => {
	it('has three axes of 9 operations (or 4 phases), 3 levels and 7 goals', () => {
		expect(columns('vorgaenge').map((c) => c.code)).toEqual([
			'Sn',
			'Ab',
			'Aw',
			'Ba',
			'Bn',
			'Bt',
			'Zf',
			'Es',
			'Bs'
		]);
		expect(columns('phasen').map((c) => [c.id, c.vorgaenge])).toEqual([
			['kollektion', ['sn']],
			['bereithaltung', ['ab', 'aw']],
			['nutzung', ['ba', 'bn', 'bt', 'zf', 'es']],
			['beseitigung', ['bs']]
		]);
		expect(ZIELE.map((z) => z.id)).toEqual(Object.keys(REQUIREMENTS));
	});

	it('lets the worse status win', () => {
		expect(worst(['umgesetzt', 'teilweise', 'entfaellt'])).toBe('teilweise');
		expect(worst(['offen', 'luecke'])).toBe('luecke');
		expect(worst([])).toBe('entfaellt');
	});

	it('judges a cell by operation, level and goal', () => {
		const record = view({
			...base,
			transparenz_e2: 'teilweise',
			transparenz_e3: 'entfaellt',
			transparenz_luecken: ['bt']
		});
		expect(cell(record, 'ab', 'e1', 'transparenz')).toBe('entfaellt');
		expect(cell(record, 'sn', 'e2', 'transparenz')).toBe('teilweise');
		expect(cell(record, 'sn', 'e3', 'transparenz')).toBe('entfaellt');
		expect(cell(record, 'bt', 'e1', 'transparenz')).toBe('luecke');
		expect(cell(record, 'bt', 'e3', 'transparenz')).toBe('entfaellt');
		expect(cell(record, 'sn', 'e1', 'vertraulichkeit')).toBe('umgesetzt');
	});

	it('folds the cube into its three faces', () => {
		const record = view({ ...base, transparenz_e2: 'teilweise', transparenz_luecken: ['bt'] });
		const cube = buildCube(record, 'phasen');
		const t = ZIELE.findIndex((z) => z.id === 'transparenz');
		// top: operations × goals, the use phase carries the disclosure gap
		expect(cube.top[t]).toEqual(['teilweise', 'teilweise', 'luecke', 'teilweise']);
		expect(cube.top[0]).toEqual(['umgesetzt', 'umgesetzt', 'umgesetzt', 'umgesetzt']);
		// side: levels × goals as assessed
		expect(cube.side[t]).toEqual(['umgesetzt', 'teilweise', 'umgesetzt']);
		// front: operations × levels over all goals, or for the chosen goal
		expect(cube.front[0]).toEqual(['umgesetzt', 'umgesetzt', 'luecke', 'umgesetzt']);
		expect(cube.front[1]).toEqual(['teilweise', 'teilweise', 'luecke', 'teilweise']);
		expect(buildCube(record, 'phasen', 'vertraulichkeit').front[1]).toEqual([
			'umgesetzt',
			'umgesetzt',
			'umgesetzt',
			'umgesetzt'
		]);
		// 5 of 9 operations apply: 5 × 3 × 7 cells
		expect(cube.counts.entfaellt).toBe(4 * 3 * 7);
		expect(cube.counts.luecke).toBe(3);
	});

	it('marks a phase without any chosen operation as not relevant', () => {
		const cube = buildCube(view({ ...base, vorgaenge: ['sn'] }), 'phasen');
		expect(cube.front[0]).toEqual(['umgesetzt', 'entfaellt', 'entfaellt', 'entfaellt']);
	});

	it('takes the nine groups for a high risk and the phases otherwise', () => {
		expect(defaultAxis(view({ risikostufe: 'hoch' }))).toBe('vorgaenge');
		expect(defaultAxis(view({ risikostufe: 'normal' }))).toBe('phasen');
	});
});

describe('SDM cube: assessment', () => {
	it('confirms a cube with every goal in place', () => {
		const result = assess(base);
		expect(result).toMatchObject({ verdict: 'negative', outcome: 'vollstaendig' });
		expect(result.explanation.de).toContain('105 von 189 Zellen sind relevant');
	});

	it('names gaps on a level and for an operation', () => {
		const result = assess({
			...base,
			transparenz_e2: 'luecke',
			intervenierbarkeit_luecken: ['bs', 'zf']
		});
		expect(result.outcome).toBe('luecken');
		// a gap for an operation the processing does not perform is ignored
		expect(result.reasons.map((r) => r.text.de)).toEqual([
			'Transparenz: Lücke auf Ebene 2 (Fachapplikation)',
			'Intervenierbarkeit: Lücke beim Beseitigen (Bs)'
		]);
	});

	it('stays incomplete while levels are unassessed or no operation is chosen', () => {
		const result = assess({ ...base, datenminimierung_e3: '' });
		expect(result.outcome).toBe('unvollstaendig');
		expect(result.notes![0].de).toBe('Noch nicht bewertet: Datenminimierung auf Ebene 3.');
		expect(assess({ ...base, vorgaenge: [] }).outcome).toBe('unvollstaendig');
	});

	it('follows up partly met goals and missing links', () => {
		const result = assess({ ...base, vertraulichkeit_e3: 'teilweise', tom: '' });
		expect(result.outcome).toBe('teilweise');
		const notes = result.notes!.map((n) => n.de);
		expect(notes).toContain('Teilweise umgesetzt: Vertraulichkeit auf Ebene 3.');
		expect(notes.some((n) => n.startsWith('Den Eintrag im TOM-Katalog verknüpfen'))).toBe(true);
		expect(
			assess({ ...base, risikostufe: 'hoch' }).notes!.some((n) =>
				n.de.includes('Folgenabschätzung')
			)
		).toBe(true);
	});

	it('sets the review as a deadline', () => {
		expect(
			engine.deadlines!(view({ ...base, wiedervorlage: '2027-03-01' })).map((d) => d.kind)
		).toEqual(['wiedervorlage']);
	});
});
