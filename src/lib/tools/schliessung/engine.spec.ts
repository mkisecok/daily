import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'planung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Filiale', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	aufbewahrung_bis: '2036-12-31'
});

describe('Standort schließen oder Geschäft aufgeben', () => {
	it('asks what closes first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
		expect(ids({})).toEqual([]);
	});

	it('asks for custody after liquidation only when the business is wound up', () => {
		expect(ids({ art: 'standort' })).not.toContain('a_verwahrung');
		expect(ids({ art: 'aufgabe' })).toContain('a_verwahrung');
		expect(ids({ art: 'standort' })).toHaveLength(8);
		expect(ids({ art: 'aufgabe', umfang: SCOPES.map((s) => s.value) })).toHaveLength(16);
	});

	it('adds devices, paper, staff, online and processors by scope', () => {
		expect(ids({ art: 'standort', umfang: ['it', 'papier'] })).toEqual(
			expect.arrayContaining(['v_geraete', 'v_akten'])
		);
		expect(ids({ art: 'standort' })).not.toContain('v_geraete');
		expect(ids({ art: 'standort', umfang: ['online'] })).toContain('w_konten');
	});

	it('names gaps with their part and points a site closure to the office move tool', () => {
		const out = assess({ ...allDone({ art: 'standort', umfang: ['it'] }), v_geraete: 'nein' });
		expect(out.reasons[0].text.de).toContain('Löschen und Vernichten: Datenträger und Geräte');
		expect(out.notes!.some((n) => n.de.includes('Standortwechsel'))).toBe(true);
	});

	it('closes only with the checklist done, then waits for final deletion', () => {
		const done = { ...allDone({ art: 'aufgabe' }), geschlossen_am: '2027-01-31' };
		expect(
			applyTransition(definition, view({ ...done, s_kontakt: 'nein' }), 'aufbewahrung')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(done), 'aufbewahrung')).toEqual({
			ok: true,
			state: 'aufbewahrung'
		});
		expect(
			applyTransition(
				definition,
				view({ ...done, geloescht_am: '2037-01-15' }, 'aufbewahrung'),
				'abgeschlossen'
			)
		).toEqual({ ok: true, state: 'abgeschlossen' });
	});

	it('sets the closure while planned and the end of retention while data is kept', () => {
		const data = { art: 'aufgabe', schliessung_am: '2027-01-31', aufbewahrung_bis: '2036-12-31' };
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['schliessung']);
		expect(engine.deadlines!(view(data, 'aufbewahrung')).map((d) => d.kind)).toEqual([
			'aufbewahrung'
		]);
		expect(engine.deadlines!(view(data, 'abgeschlossen'))).toEqual([]);
	});
});
