import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const screening = (verdict: 'positive' | 'negative') => ({
	tool: 'dsfa-schwellwert',
	catalogVersion: 1,
	verdict,
	headline: { de: 'Ergebnis.', en: 'Result.' },
	at: '2026-11-13T09:00:00.000Z'
});
const view = (data: RecordData, state = 'aufbau') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Meldestelle', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	dsfa_check: screening('negative')
});

describe('Hinweisgebersystem einrichten', () => {
	it('applies office, data protection and handling always and the rest by scope', () => {
		expect(ids({})).toHaveLength(13);
		expect(ids({})).not.toContain('d_avv');
		expect(ids({ umfang: ['software'] })).toEqual(expect.arrayContaining(['d_avv', 't_tom']));
		expect(ids({ umfang: ['software'] })).not.toContain('d_folgemassnahmen');
		expect(ids({ umfang: ['anonym'] })).toContain('t_anonym');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(19);
	});

	it('wants the screening and a linked DPIA when it says so', () => {
		const base = allDone({});
		expect(assess({ ...base, dsfa_check: null }).outcome).toBe('offen');
		const needed = assess({ ...base, dsfa_check: screening('positive') });
		expect(needed.outcome).toBe('luecken');
		expect(needed.reasons[0].questionId).toBe('dsfa');
		expect(assess(base).outcome).toBe('erledigt');
	});

	it('names gaps with their part and notes a small employer', () => {
		const out = assess({ ...allDone({}), v_eingang: 'nein', beschaeftigte: 30 });
		expect(out.reasons[0].text.de).toBe(
			'Umgang mit Meldungen: Eingang spätestens nach sieben Tagen bestätigt'
		);
		expect((out.notes ?? []).map((n) => n.de).join(' ')).toContain('Unter 50 Beschäftigten');
	});

	it('goes live once the checklist and the DPIA question are settled', () => {
		const done = { ...allDone({}), in_betrieb_seit: '2027-01-01' };
		expect(
			applyTransition(definition, view({ ...done, dsfa_check: screening('positive') }), 'betrieb')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(done), 'betrieb')).toEqual({
			ok: true,
			state: 'betrieb'
		});
	});

	it('sets the start while being set up and the review once live', () => {
		const data = { start_am: '2027-01-01', wiedervorlage: '2028-01-01' };
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['start']);
		expect(engine.deadlines!(view(data, 'betrieb')).map((d) => d.kind)).toEqual(['wiedervorlage']);
	});
});
