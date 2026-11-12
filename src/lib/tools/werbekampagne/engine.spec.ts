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
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Frühjahr', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	avv: 'avv-1'
});

describe('Newsletter oder Werbekampagne', () => {
	it('asks for the channels first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
	});

	it('applies the parts the channels name', () => {
		expect(ids({ umfang: ['email'] })).toEqual([
			'g_zweck',
			'g_hinweis',
			'g_sperrliste',
			'e_einwilligung',
			'e_absender',
			'e_abmelden'
		]);
		expect(ids({ umfang: ['telefon'] })).toEqual(
			expect.arrayContaining(['t_einwilligung', 't_doku'])
		);
		expect(ids({ umfang: ['drittland'] })).toEqual(
			expect.arrayContaining(['v_avv', 'v_drittland'])
		);
		expect(ids({ umfang: ['dienstleister'] })).not.toContain('v_drittland');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(19);
	});

	it('treats a failed balancing test for letters as a gap and wants it run', () => {
		const base = allDone({ umfang: ['post'] });
		expect(assess(base).notes!.some((n) => n.de.includes('Interessenabwägung'))).toBe(true);
		expect(
			assess({ ...base, abwaegung: result('interessenabwaegung', 'positive') }).reasons[0]
				.questionId
		).toBe('abwaegung');
		expect(assess({ ...base, abwaegung: result('interessenabwaegung', 'negative') }).outcome).toBe(
			'versandbereit'
		);
	});

	it('names a missing condition of the existing-customer rule as a gap', () => {
		const out = assess({ ...allDone({ umfang: ['email', 'bestandskunden'] }), b_aehnlich: 'nein' });
		expect(out.reasons[0].text.de).toBe(
			'Bestandskundenregel: Werbung nur für eigene ähnliche Waren oder Dienstleistungen'
		);
	});

	it('approves only when the checklist and the checks needed are complete', () => {
		const ready = { ...allDone({ umfang: ['drittland'] }), freigabe_am: '2027-03-01' };
		expect(applyTransition(definition, view(ready), 'freigegeben')).toMatchObject({
			error: 'blocked'
		});
		expect(
			applyTransition(
				definition,
				view({ ...ready, transfer_check: result('drittland-transfer', 'negative') }),
				'freigegeben'
			)
		).toEqual({ ok: true, state: 'freigegeben' });
	});

	it('sets the send date while under review, and gaps with a due date', () => {
		const data = {
			umfang: ['email'],
			versand_am: '2027-03-15',
			e_absender: 'nein',
			e_absender_frist: '2027-03-01'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'versand',
			'luecke-e_absender'
		]);
		expect(engine.deadlines!(view(data, 'freigegeben')).map((d) => d.kind)).toEqual([
			'luecke-e_absender'
		]);
	});
});
