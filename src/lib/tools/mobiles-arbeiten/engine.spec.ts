import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Mobiles Arbeiten', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	tom: 'tom-1'
});

describe('Homeoffice und mobiles Arbeiten', () => {
	it('applies the core parts always and the rest by scope', () => {
		expect(ids({})).toHaveLength(13);
		expect(ids({})).not.toContain('r_betriebsrat');
		expect(ids({ umfang: ['betriebsrat'] })).toContain('r_betriebsrat');
		expect(ids({ umfang: ['privatgeraete', 'papier'] })).toEqual(
			expect.arrayContaining(['p_trennung', 'd_vernichtung'])
		);
		expect(ids({ umfang: ['ausland'] })).toEqual(expect.arrayContaining(['x_regel', 'x_risiko']));
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(23);
	});

	it('says what a missing scope means and asks for the TOM link', () => {
		const notes = assess({}).notes!.map((n) => n.de);
		expect(notes.some((n) => n.startsWith('Kein Umfang angegeben'))).toBe(true);
		expect(notes).toContain('Den TOM-Katalog verknüpfen.');
	});

	it('names gaps with their part', () => {
		const result = assess({ ...allDone({ umfang: ['privatgeraete'] }), p_trennung: 'nein' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons[0].text.de).toBe(
			'Private Geräte: Dienstliche Daten getrennt in einem verwalteten Bereich (Container, verwaltete Apps)'
		);
	});

	it('approves only when the checklist is done', () => {
		const ready = { ...allDone({ umfang: ['betriebsrat'] }), freigabe_am: '2026-12-01' };
		expect(assess(ready).outcome).toBe('freigabefaehig');
		expect(
			applyTransition(definition, view({ ...ready, r_betriebsrat: null }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(ready), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('sets the start, the review and gaps with a due date as deadlines', () => {
		const data = {
			start_am: '2027-01-01',
			t_vpn: 'nein',
			t_vpn_frist: '2026-12-15',
			wiedervorlage: '2027-12-01'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['start', 'luecke-t_vpn']);
		expect(engine.deadlines!(view(data, 'freigegeben')).map((d) => d.kind)).toEqual([
			'wiedervorlage',
			'luecke-t_vpn'
		]);
	});
});
