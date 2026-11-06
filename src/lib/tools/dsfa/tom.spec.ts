import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { engine } from './engine.js';
import { compareWithTom } from './tom.js';

const view = (data: RecordData) => ({ state: 'entwurf', data });

const dsfa = view({
	// a risk lowered by measures that the TOM entry shows in place
	vertraulichkeit_gefaehrdungen: ['G 0.23'],
	vertraulichkeit_w: '3',
	vertraulichkeit_s: '4',
	vertraulichkeit_rw: '2',
	vertraulichkeit_rs: '2',
	// a rated risk with no measure in the TOM entry
	integritaet_w: '2',
	integritaet_s: '2',
	// a lowered residual risk without any measure behind it
	verfuegbarkeit_w: '3',
	verfuegbarkeit_s: '3',
	verfuegbarkeit_rw: '1',
	verfuegbarkeit_rs: '1',
	// threats named, not yet rated
	transparenz_gefaehrdungen: ['DS 3']
});

const tom = view({
	schutzbedarf: 'normal',
	vertraulichkeit_massnahmen: ['mfa', 'ruhe'],
	verfuegbarkeit_massnahmen: [],
	datenminimierung_massnahmen: ['loeschroutinen']
});

describe('DSFA: comparison with the TOM catalogue', () => {
	const result = compareWithTom(dsfa, tom);
	const byGoal = Object.fromEntries(result.goals.map((g) => [g.risk.goal, g]));

	it('pairs every risk with the measures of the same SDM goal', () => {
		expect(result.goals.map((g) => g.goal.de)).toEqual([
			'Vertraulichkeit',
			'Integrität',
			'Verfügbarkeit',
			'Datenminimierung',
			'Nichtverkettung',
			'Transparenz',
			'Intervenierbarkeit'
		]);
		expect(byGoal.vertraulichkeit.measures.map((m) => m.de)).toEqual([
			'Mehr-Faktor-Authentisierung',
			'Verschlüsselung gespeicherter Daten'
		]);
	});

	it('marks covered goals, gaps, unbacked reductions and open goals', () => {
		expect(Object.fromEntries(result.goals.map((g) => [g.risk.goal, g.status]))).toEqual({
			vertraulichkeit: 'abgedeckt',
			integritaet: 'luecke',
			verfuegbarkeit: 'unbelegt',
			datenminimierung: 'abgedeckt',
			nichtverkettung: 'offen',
			transparenz: 'luecke',
			intervenierbarkeit: 'offen'
		});
	});

	it('derives the protection need from the initial risk and flags a TOM entry that assumes less', () => {
		expect(result.need).toBe('hoch');
		expect(result.tomNeed).toBe('normal');
		expect(result.needTooLow).toBe(true);
		expect(compareWithTom(dsfa, view({ ...tom.data, schutzbedarf: 'sehr_hoch' })).needTooLow).toBe(
			false
		);
	});

	it('leaves the protection need open while nothing is rated', () => {
		const empty = compareWithTom(view({}), tom);
		expect(empty.need).toBeNull();
		expect(empty.needTooLow).toBe(false);
		// measures in place count as covered even before the goal is assessed
		expect(empty.goals.map((g) => g.status)).toEqual([
			'abgedeckt',
			'offen',
			'offen',
			'abgedeckt',
			'offen',
			'offen',
			'offen'
		]);
	});

	it('assumes a normal need when no risk is high', () => {
		const low = view({ integritaet_w: '2', integritaet_s: '2' });
		expect(compareWithTom(low, tom)).toMatchObject({ need: 'normal', needTooLow: false });
	});
});

describe('DSFA: TOM link in the assessment', () => {
	const notes = (data: RecordData) => engine.assess!(view(data))!.notes!.map((n) => n.de);
	const hint = 'Den Eintrag des Systems im TOM-Katalog verknüpfen';

	it('asks for the TOM entry once a risk is rated', () => {
		expect(notes({ integritaet_w: '2', integritaet_s: '2' }).some((n) => n.startsWith(hint))).toBe(
			true
		);
		expect(
			notes({ integritaet_w: '2', integritaet_s: '2', tom: 'tom-1' }).some((n) =>
				n.startsWith(hint)
			)
		).toBe(false);
		expect(notes({}).some((n) => n.startsWith(hint))).toBe(false);
	});
});
