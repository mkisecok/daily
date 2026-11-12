import { describe, expect, it } from 'vitest';
import { computeDeadlines } from '../../records/deadlines.js';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData, StoredRecord } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { getRecordTool } from '../registry.js';
import { applies, assessRisks, ITEMS, RISKS } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'planung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Umzug Köln → Berlin', ...data }).data
});
const assess = (data: RecordData, state?: string) => engine.assess!(view(data, state))!;

/** every applicable point answered yes for the given scope */
const allDone = (umfang: string[], extra: RecordData = {}): RecordData => {
	const base = { umfang, ...extra };
	const record = view(base);
	return {
		...base,
		...Object.fromEntries(
			ITEMS.filter((item) => applies(record, item)).map((item) => [item.id, true])
		)
	};
};
/** every applicable risk rated low */
const allRatedLow = (umfang: string[]): RecordData =>
	Object.fromEntries(
		RISKS.filter((risk) => applies(view({ umfang }), risk)).flatMap((risk) => [
			[`${risk.id}_w`, '1'],
			[`${risk.id}_s`, '1']
		])
	);

describe('Standortwechsel: scope', () => {
	it('asks for the scope before anything else', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
	});

	it('applies server room points and risks only when the server room moves', () => {
		const office = view({ umfang: ['arbeitsplaetze'] });
		const server = view({ umfang: ['serverraum'] });
		const ids = (record: typeof office) => ITEMS.filter((i) => applies(record, i)).map((i) => i.id);
		expect(ids(office)).not.toContain('s_sicherung');
		expect(ids(server)).toContain('s_sicherung');
		expect(ids(office)).toContain('n_arbeitsplatz');
		expect(ids(server)).not.toContain('n_arbeitsplatz');
		expect(assessRisks(office).map((r) => r.id)).not.toContain('r_ausfall');
		expect(assessRisks(server).map((r) => r.id)).toEqual(
			expect.arrayContaining(['r_ausfall', 'r_umgebung', 'r_transport'])
		);
	});

	it('asks about the new authority only for a move into another federal state', () => {
		expect(
			ITEMS.filter((i) => applies(view({ umfang: ['akten'] }), i)).map((i) => i.id)
		).not.toContain('d_aufsicht');
		const interstate = view({ umfang: ['akten'], bundesland_wechsel: true });
		expect(ITEMS.filter((i) => applies(interstate, i)).map((i) => i.id)).toContain('d_aufsicht');
		expect(
			assess({ umfang: ['akten'], bundesland_wechsel: true }).notes!.some((n) =>
				n.de.includes('§ 40 Abs. 2 BDSG')
			)
		).toBe(true);
	});
});

describe('Standortwechsel: assessment', () => {
	it('is done when every point is met and no residual risk is high', () => {
		const scope = ['arbeitsplaetze', 'akten', 'serverraum', 'netz'];
		const result = assess({ ...allDone(scope), ...allRatedLow(scope), tom: 'tom-1' });
		expect(result).toMatchObject({ verdict: 'negative', outcome: 'erledigt' });
		expect(result.notes).toEqual([]);
	});

	it('names a "no" as a gap with its block and citation', () => {
		const scope = ['serverraum'];
		const result = assess({ ...allDone(scope), ...allRatedLow(scope), s_zutritt: false });
		expect(result).toMatchObject({ verdict: 'positive', outcome: 'luecken' });
		expect(result.reasons).toEqual([
			expect.objectContaining({
				questionId: 's_zutritt',
				cite: { law: 'BSI', ref: 'INF.2 Rechenzentrum sowie Serverraum' }
			})
		]);
		expect(result.reasons[0].text.de).toMatch(/^Serverraum: Neuer Serverraum/);
	});

	it('puts a high residual risk first', () => {
		const scope = ['serverraum'];
		const result = assess({
			...allDone(scope),
			...allRatedLow(scope),
			s_strom: false,
			r_umgebung_w: '3',
			r_umgebung_s: '4'
		});
		expect(result.outcome).toBe('risiko_hoch');
		expect(result.reasons.map((r) => r.questionId)).toEqual(['r_umgebung', 's_strom']);
	});

	it('stays open while points are unanswered or risks unrated, and counts them', () => {
		const result = assess({ umfang: ['akten'] });
		expect(result).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
		expect(result.notes![0].de).toMatch(/^Noch offen: Vor dem Umzug 4, Transport 3/);
		expect(result.explanation.de).toContain('0 von');
	});

	it('flags a risk rated lower without a measure', () => {
		const result = assess({
			umfang: ['akten'],
			r_transport_w: '3',
			r_transport_s: '4',
			r_transport_rw: '1',
			r_transport_rs: '1'
		});
		expect(
			result.notes!.some((n) =>
				n.de.startsWith('Verlust oder Diebstahl beim Transport: nach Maßnahmen niedriger')
			)
		).toBe(true);
	});

	it('reminds of the 72 hours while moving', () => {
		expect(
			assess({ umfang: ['akten'] }, 'umzug').notes!.some((n) => n.de.includes('72 Stunden'))
		).toBe(true);
	});
});

describe('Standortwechsel: workflow and deadlines', () => {
	const tool = getRecordTool('standortwechsel')!;
	const stored = (data: RecordData, state: string): StoredRecord => ({
		id: 'sw-1',
		toolSlug: 'standortwechsel',
		definitionVersion: 1,
		state,
		title: 'Umzug',
		data: view(data, state).data,
		version: 1,
		createdAt: '2026-11-01T09:00:00.000Z',
		updatedAt: '2026-11-01T09:00:00.000Z',
		archivedAt: null
	});

	it('does not start the move of a server room without the backup', () => {
		const data = { umfang: ['serverraum'], umzugstermin: '2026-12-05' };
		expect(applyTransition(definition, view(data), 'umzug')).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view({ ...data, s_sicherung: true }), 'umzug')).toEqual({
			ok: true,
			state: 'umzug'
		});
	});

	it('closes only with every point done and no high residual risk', () => {
		const scope = ['akten'];
		const ready = { ...allDone(scope), ...allRatedLow(scope), begehung_am: '2027-01-10' };
		expect(
			applyTransition(
				definition,
				view({ ...ready, a_post: false }, 'nachbereitung'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		expect(
			applyTransition(
				definition,
				view({ ...ready, r_transport_w: '4', r_transport_s: '4' }, 'nachbereitung'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(ready, 'nachbereitung'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the backup the day before the move, the move and later the walk-through', () => {
		const planning = computeDeadlines(
			tool,
			stored(
				{ umfang: ['serverraum'], umzugstermin: '2026-12-05', begehung_am: '2027-01-10' },
				'planung'
			)
		);
		expect(planning.map((d) => [d.kind, d.dueAt.slice(0, 10)])).toEqual([
			['datensicherung', '2026-12-04'],
			['umzug', '2026-12-05']
		]);
		const after = computeDeadlines(
			tool,
			stored(
				{ umfang: ['serverraum'], umzugstermin: '2026-12-05', begehung_am: '2027-01-10' },
				'nachbereitung'
			)
		);
		expect(after.map((d) => d.kind)).toEqual(['begehung']);
	});

	it('settles a point marked not applicable and dates a gap with a due date', () => {
		const scope = ['akten'];
		const done = { ...allDone(scope), ...allRatedLow(scope), a_post: 'entfaellt' };
		expect(assess(done).outcome).toBe('erledigt');
		const gap = computeDeadlines(
			tool,
			stored({ ...done, a_post: 'nein', a_post_frist: '2026-12-20' }, 'nachbereitung')
		);
		expect(gap.map((d) => [d.kind, d.dueAt.slice(0, 10)])).toEqual([
			['luecke-a_post', '2026-12-20']
		]);
		// a gap in a part that does not move sets no deadline
		const outOfScope = computeDeadlines(
			tool,
			stored({ ...done, s_strom: 'nein', s_strom_frist: '2026-12-20' }, 'nachbereitung')
		);
		expect(outOfScope).toEqual([]);
	});
});
