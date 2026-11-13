import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, PREPARATION, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'vorbereitung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Audit', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData, blocks = BLOCKS) =>
	checklist(view(data).data, blocks).points.map(({ item }) => item.id);
const allDone = (data: RecordData, blocks = BLOCKS): RecordData => ({
	...data,
	...Object.fromEntries(ids(data, blocks).map((id) => [id, 'ja']))
});

describe('Audit als geprüfte Stelle vorbereiten', () => {
	it('applies frame and follow-up always and the rest by scope', () => {
		expect(ids({})).toHaveLength(6);
		expect(ids({ umfang: ['iso27001'] })).toContain('i_soa');
		expect(ids({ umfang: ['iso27001'] })).not.toContain('i_ki_folgen');
		expect(ids({ umfang: ['iso42001'] })).toContain('i_ki_folgen');
		expect(ids({ umfang: ['kunde'] })).toContain('k_vertrag');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(19);
	});

	it('treats major nonconformities as a reason and minor ones as a note', () => {
		const done = allDone({ umfang: ['iso27001'] });
		const major = assess({ ...done, ergebnis: 'wesentlich' });
		expect(major.outcome).toBe('luecken');
		expect(major.reasons[0].questionId).toBe('ergebnis');
		const minor = assess({ ...done, ergebnis: 'geringfuegig' });
		expect(minor.outcome).toBe('erledigt');
		expect((minor.notes ?? []).map((n) => n.de).join(' ')).toContain('Frist für die Korrekturen');
	});

	it('names gaps with their part', () => {
		const out = assess({ ...allDone({ umfang: ['kunde'] }), k_andere: 'nein' });
		expect(out.reasons[0].text.de).toBe(
			'Kundenaudit: Daten anderer Kunden geschützt; nur der eigene Auftrag ist einsehbar'
		);
	});

	it('holds the audit after the preparation and closes it with the findings', () => {
		const prepared = allDone({ umfang: ['kunde'] }, PREPARATION);
		expect(applyTransition(definition, view({}), 'durchgefuehrt')).toMatchObject({
			error: 'blocked'
		});
		expect(applyTransition(definition, view(prepared), 'durchgefuehrt')).toEqual({
			ok: true,
			state: 'durchgefuehrt'
		});
		expect(
			applyTransition(
				definition,
				view({ ...prepared, ergebnis: 'ohne' }, 'durchgefuehrt'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		const done = { ...allDone({ umfang: ['kunde'] }), ergebnis: 'ohne' };
		expect(applyTransition(definition, view(done, 'durchgefuehrt'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the audit day while preparing and the corrections once held', () => {
		const data = { termin: '2027-03-10', korrektur_bis: '2027-06-10' };
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['termin']);
		expect(engine.deadlines!(view(data, 'durchgefuehrt')).map((d) => d.kind)).toEqual([
			'korrektur'
		]);
	});
});
