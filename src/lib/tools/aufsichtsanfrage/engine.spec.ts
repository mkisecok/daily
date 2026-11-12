import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { dateAfterDays, definition, engine, remedyDeadline } from './engine.js';

const view = (data: RecordData, state = 'offen') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Az. 1/26', eingang_am: '2026-11-10', ...data })
		.data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja']))
});

describe('Anfrage der Aufsichtsbehörde', () => {
	it('asks for the occasion first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
		expect(ids({})).toEqual([]);
	});

	it('applies the parts the occasion needs', () => {
		expect(ids({ anlass: 'beschwerde' })).toEqual(
			expect.arrayContaining(['e_frist', 's_verweigerung', 'b_nachgeholt', 'a_versand'])
		);
		expect(ids({ anlass: 'beschwerde' })).not.toContain('v_termin');
		expect(ids({ anlass: 'vor_ort' })).toEqual(expect.arrayContaining(['v_zugang', 's_fragen']));
		expect(ids({ anlass: 'vor_ort' })).not.toContain('a_versand');
		expect(ids({ anlass: 'bescheid' })).toEqual([
			'e_frist',
			'e_echt',
			'e_intern',
			'e_kontakt',
			'r_beistand',
			'r_frist',
			'r_umsetzung'
		]);
	});

	it('works out the remedy deadline from the date of service', () => {
		expect(remedyDeadline('bescheid', '2026-01-31')).toMatchObject({
			due: '2026-02-28',
			cite: { law: 'VwGO' }
		});
		expect(remedyDeadline('bussgeld', '2026-12-24')).toMatchObject({
			due: '2027-01-07',
			cite: { law: 'OWiG' }
		});
		expect(remedyDeadline('beschwerde', '2026-12-24')).toBeNull();
		expect(dateAfterDays('2026-03-25', 14)).toBe('2026-04-08');
	});

	it('names the remedy deadline, or asks for the date of service', () => {
		expect(
			assess({ anlass: 'bescheid', bescheid_am: '2026-11-12' }).notes!.some((n) =>
				n.de.includes('Klagefrist gegen den Bescheid: spätestens am 12.12.2026')
			)
		).toBe(true);
		expect(assess({ anlass: 'bescheid' }).notes!.some((n) => n.de.includes('Zustelldatum'))).toBe(
			true
		);
	});

	it('names gaps with their part and asks to link the request behind a complaint', () => {
		const result = assess({ ...allDone({ anlass: 'beschwerde' }), b_nachgeholt: 'nein' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons[0].text.de).toContain('Beschwerde: Das ursprüngliche Anliegen');
		expect(result.notes!.some((n) => n.de.includes('Betroffenenanfrage verknüpfen'))).toBe(true);
	});

	it('marks the reply sent only when the checklist is done', () => {
		const ready = { ...allDone({ anlass: 'pruefung' }), antwort_am: '2026-11-28' };
		expect(
			applyTransition(definition, view({ ...ready, a_versand: 'nein' }), 'beantwortet')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(ready), 'beantwortet')).toEqual({
			ok: true,
			state: 'beantwortet'
		});
	});

	it('sets the reply deadline, the remedy deadline and gaps with a due date', () => {
		const data = {
			anlass: 'bussgeld',
			frist: '2026-11-30',
			bescheid_am: '2026-11-20',
			r_beistand: 'nein',
			r_beistand_frist: '2026-11-22'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'antwort',
			'rechtsbehelf',
			'luecke-r_beistand'
		]);
		expect(engine.deadlines!(view(data, 'beantwortet')).map((d) => d.kind)).toEqual([
			'rechtsbehelf',
			'luecke-r_beistand'
		]);
	});
});
