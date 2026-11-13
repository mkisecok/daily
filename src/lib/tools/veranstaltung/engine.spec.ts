import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const balance = (verdict: 'positive' | 'negative') => ({
	tool: 'interessenabwaegung',
	catalogVersion: 1,
	verdict,
	headline: { de: 'Ergebnis.', en: 'Result.' },
	at: '2026-11-13T09:00:00.000Z'
});
const view = (data: RecordData, state = 'planung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Sommerfest', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	loeschung_am: '2027-08-01'
});

describe('Veranstaltung mit Fotos und Gästeliste', () => {
	it('applies registration and deletion always and the rest by scope', () => {
		expect(ids({})).toEqual(['g_hinweise', 'g_umfang', 'n_loeschen', 'n_vvt']);
		expect(ids({ umfang: ['fotos'] })).toEqual(
			expect.arrayContaining(['f_grundlage', 'f_widerspruch'])
		);
		expect(ids({ umfang: ['essen'] })).toContain('g_besondere');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(17);
	});

	it('wants the balancing test for photos and treats a failed one as a gap', () => {
		const base = allDone({ umfang: ['fotos'] });
		expect(assess(base).outcome).toBe('offen');
		const failed = assess({ ...base, abwaegung: balance('positive') });
		expect(failed.reasons[0].questionId).toBe('abwaegung');
		expect(failed.reasons[0].text.de).toContain('nur mit Einwilligung');
		expect(assess({ ...base, abwaegung: balance('negative') }).outcome).toBe('erledigt');
	});

	it('names gaps with their part', () => {
		const out = assess({ ...allDone({ umfang: ['kinder'] }), c_einwilligung: 'nein' });
		expect(out.reasons[0].text.de).toBe(
			'Kinder: Fotos von Kindern nur mit Einwilligung der Sorgeberechtigten'
		);
	});

	it('closes after the event once the guest list is deleted and the checklist is done', () => {
		const done = { ...allDone({}), geloescht_am: '2027-08-01' };
		expect(applyTransition(definition, view(done), 'abgeschlossen')).toMatchObject({
			error: expect.any(String)
		});
		expect(
			applyTransition(
				definition,
				view({ ...done, n_loeschen: 'nein' }, 'durchgefuehrt'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(done, 'durchgefuehrt'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the date while planned and the deletion once held', () => {
		const data = { termin: '2027-07-10', loeschung_am: '2027-08-01' };
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['termin']);
		expect(engine.deadlines!(view(data, 'durchgefuehrt')).map((d) => d.kind)).toEqual([
			'loeschung'
		]);
	});
});
