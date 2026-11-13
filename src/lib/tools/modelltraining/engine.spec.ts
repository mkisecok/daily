import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const result = (tool: string, verdict: 'positive' | 'negative') => ({
	tool,
	catalogVersion: 1,
	verdict,
	headline: { de: 'Ergebnis.', en: 'Result.' },
	at: '2026-11-13T09:00:00.000Z'
});
const view = (data: RecordData, state = 'training') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Modell', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	abwaegung: result('interessenabwaegung', 'negative'),
	dsfa_check: result('dsfa-schwellwert', 'negative')
});

describe('Eigenes Modell trainieren', () => {
	it('applies purpose and role always and the data parts with personal data', () => {
		expect(ids({})).toEqual(['r_zweck', 'r_anbieter']);
		expect(ids({ umfang: ['personenbezug'] })).toHaveLength(11);
		expect(ids({ umfang: ['allgemein'] })).toContain('g_urheber');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(20);
	});

	it('notes when no personal data is in scope and needs no checks then', () => {
		const out = assess(allDone({}));
		expect(out.outcome).toBe('erledigt');
		expect((out.notes ?? []).map((n) => n.de).join(' ')).toContain('gilt die DSGVO nicht');
	});

	it('wants the balancing test and the screening with personal data', () => {
		const base = allDone({ umfang: ['personenbezug'] });
		expect(assess({ ...base, abwaegung: null }).outcome).toBe('offen');
		const failed = assess({ ...base, abwaegung: result('interessenabwaegung', 'positive') });
		expect(failed.reasons[0].questionId).toBe('abwaegung');
		const dpia = assess({ ...base, dsfa_check: result('dsfa-schwellwert', 'positive') });
		expect(dpia.reasons[0].questionId).toBe('dsfa');
		expect(assess(base).outcome).toBe('erledigt');
	});

	it('names gaps with their part', () => {
		const out = assess({ ...allDone({ umfang: ['personenbezug'] }), m_anonym: 'nein' });
		expect(out.reasons[0].text.de).toBe(
			'Modell und Ausgaben: Getestet, ob sich personenbezogene Daten aus dem Modell abfragen lassen; Ergebnis dokumentiert'
		);
	});

	it('releases once the checklist and the checks are settled', () => {
		const done = { ...allDone({ umfang: ['personenbezug'] }), freigabe_am: '2027-03-01' };
		expect(
			applyTransition(
				definition,
				view({ ...done, abwaegung: result('interessenabwaegung', 'positive') }),
				'freigegeben'
			)
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(done), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('sets the training start while in concept', () => {
		const data = { training_ab: '2027-02-01' };
		expect(engine.deadlines!(view(data, 'konzept')).map((d) => d.kind)).toEqual(['training']);
		expect(engine.deadlines!(view(data))).toEqual([]);
	});
});
