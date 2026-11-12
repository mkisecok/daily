import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { definition, engine } from './engine.js';

const snapshot = (tool: string, verdict: 'positive' | 'conditional' | 'negative') => ({
	tool,
	catalogVersion: 1,
	verdict,
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Lager Nord', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
/** every applicable point answered ja, with a balancing test that holds and a screening */
const ready = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	abwaegung: snapshot('interessenabwaegung', 'negative'),
	dsfa_check: snapshot('dsfa-schwellwert', 'negative'),
	vvt: 'vvt-1'
});

describe('Videoüberwachung einrichten', () => {
	it('applies storage, remote access and staff only when they are in scope', () => {
		expect(ids({})).toContain('h_schild');
		expect(ids({})).not.toContain('s_dauer');
		expect(ids({})).not.toContain('e_ton');
		expect(ids({ umfang: ['aufzeichnung', 'funktionen'] })).toEqual(
			expect.arrayContaining(['s_dauer', 's_loeschung', 'e_ton', 'e_schwenk'])
		);
		expect(ids({ umfang: ['beschaeftigte'] })).toContain('b_betriebsrat');
		expect(ids({ umfang: SCOPE_ALL }).length).toBe(26);
	});

	it('says what a missing scope means', () => {
		expect(assess({}).notes!.some((n) => n.de.startsWith('Kein Umfang angegeben'))).toBe(true);
	});

	it('keeps the entry open until the balancing test and the screening are attached', () => {
		const data = { ...ready({}), abwaegung: null, dsfa_check: null };
		const result = assess(data);
		expect(result.outcome).toBe('offen');
		expect(result.notes).toContainEqual({
			de: 'Noch durchzuführen: Interessenabwägung, DSFA-Schwellwertanalyse.',
			en: 'Still to run: legitimate-interest assessment, DPIA screening.'
		});
	});

	it('treats a failed balancing test and a required DPIA as gaps', () => {
		const failed = assess({ ...ready({}), abwaegung: snapshot('interessenabwaegung', 'positive') });
		expect(failed.outcome).toBe('luecken');
		expect(failed.reasons[0].questionId).toBe('abwaegung');
		const dpia = assess({ ...ready({}), dsfa_check: snapshot('dsfa-schwellwert', 'positive') });
		expect(dpia.reasons.map((r) => r.questionId)).toEqual(['dsfa']);
		expect(
			assess({ ...ready({}), dsfa_check: snapshot('dsfa-schwellwert', 'positive'), dsfa: 'd-1' })
				.outcome
		).toBe('freigabefaehig');
	});

	it('names gaps with their part', () => {
		const result = assess({ ...ready({ umfang: ['aufzeichnung'] }), s_dauer: 'nein' });
		expect(result.reasons[0].text.de).toBe(
			'Speicherung und Zugriff: Speicherdauer festgelegt, in der Regel höchstens 72 Stunden; eine längere ist begründet'
		);
	});

	it('approves only when the checklist and the checks are complete', () => {
		const data = { ...ready({ umfang: ['aufzeichnung'] }), freigabe_am: '2026-11-20' };
		expect(
			applyTransition(definition, view({ ...data, h_schild: 'nein' }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(
			applyTransition(definition, view({ ...data, abwaegung: null }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(data), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('sets the start, the review and gaps with a due date as deadlines', () => {
		const data = {
			inbetrieb_ab: '2026-12-01',
			h_schild: 'nein',
			h_schild_frist: '2026-11-28',
			wiedervorlage: '2027-11-01'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'inbetrieb',
			'luecke-h_schild'
		]);
		expect(engine.deadlines!(view(data, 'freigegeben')).map((d) => d.kind)).toEqual([
			'wiedervorlage',
			'luecke-h_schild'
		]);
	});
});

const SCOPE_ALL = ['oeffentlich', 'aufzeichnung', 'beschaeftigte', 'fernzugriff', 'funktionen'];
