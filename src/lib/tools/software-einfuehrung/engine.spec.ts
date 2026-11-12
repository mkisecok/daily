import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { definition, engine } from './engine.js';

const snapshot = (
	tool: string,
	verdict: 'positive' | 'conditional' | 'negative',
	outcome?: string
) => ({
	tool,
	catalogVersion: 1,
	verdict,
	...(outcome ? { outcome } : {}),
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Personio', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
/** every applicable point answered ja */
const allDone = (data: RecordData): RecordData => {
	const points = checklist(view(data).data, BLOCKS).points;
	return { ...data, ...Object.fromEntries(points.map(({ item }) => [item.id, 'ja'])) };
};

describe('Neue Software einführen', () => {
	it('asks for the scope first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
	});

	it('applies the parts the scope names', () => {
		const ids = (umfang: string[]) =>
			checklist(view({ umfang }).data, BLOCKS).points.map(({ item }) => item.id);
		expect(ids(['personenbezug'])).toContain('d_zweck');
		expect(ids(['personenbezug'])).not.toContain('d_avv');
		expect(ids(['personenbezug', 'cloud'])).toEqual(
			expect.arrayContaining(['d_avv', 's_ausstieg'])
		);
		expect(ids(['beschaeftigte'])).toContain('b_betriebsrat');
		expect(ids(['beschaeftigte'])).not.toContain('d_zweck');
	});

	it('wants the DPIA screening for personal data, and the DPIA itself when it says so', () => {
		const base = allDone({ umfang: ['personenbezug'] });
		expect(assess(base).notes!.some((n) => n.de.includes('DSFA-Schwellwertanalyse'))).toBe(true);
		const required = assess({ ...base, dsfa_check: snapshot('dsfa-schwellwert', 'positive') });
		expect(required.outcome).toBe('luecken');
		expect(required.reasons[0].questionId).toBe('dsfa');
		expect(
			assess({ ...base, dsfa_check: snapshot('dsfa-schwellwert', 'positive'), dsfa: 'dsfa-1' })
				.outcome
		).toBe('freigabefaehig');
	});

	it('treats a third-country check without a basis as a gap', () => {
		const data = allDone({ umfang: ['drittland'] });
		expect(assess(data).outcome).toBe('offen');
		expect(
			assess({ ...data, transfer_check: snapshot('drittland-transfer', 'positive') }).reasons.map(
				(r) => r.questionId
			)
		).toEqual(['transfer_check']);
	});

	it('names gaps with their part, points to the AI tool for AI functions', () => {
		const result = assess({ ...allDone({ umfang: ['ki'] }), s_protokoll: 'nein' });
		expect(result.reasons[0].text.de).toBe(
			'Sicherheit: Zugriffe und Änderungen werden protokolliert'
		);
		expect(result.notes!.some((n) => n.de.includes('KI-Tool einführen'))).toBe(true);
	});

	it('approves only when the checklist and the checks needed are complete', () => {
		const ready = {
			...allDone({ umfang: ['personenbezug'] }),
			dsfa_check: snapshot('dsfa-schwellwert', 'negative'),
			freigabe_am: '2026-11-20'
		};
		expect(
			applyTransition(definition, view({ ...ready, d_vvt: 'nein' }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(
			applyTransition(definition, view({ ...ready, dsfa_check: null }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(ready), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('sets the planned start, the review and gaps with a due date as deadlines', () => {
		const data = {
			umfang: ['beschaeftigte'],
			einsatz_ab: '2026-12-01',
			b_betriebsrat: 'nein',
			b_betriebsrat_frist: '2026-11-25',
			wiedervorlage: '2027-06-01'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'einsatz',
			'luecke-b_betriebsrat'
		]);
		expect(engine.deadlines!(view(data, 'freigegeben')).map((d) => d.kind)).toEqual([
			'wiedervorlage',
			'luecke-b_betriebsrat'
		]);
	});
});
