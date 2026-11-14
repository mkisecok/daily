import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { applyTransition } from '../../records/workflow.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'laufend') => ({
	state,
	data: validateRecord(definition, { organisation: 'Muster GmbH', ...data }).data
});
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const answered = (data: RecordData, value = 'ja'): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, value]))
});

describe('Bestandsaufnahme', () => {
	it('asks 20 points always and five more by scope', () => {
		expect(ids({})).toHaveLength(20);
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(25);
	});

	it('reports the gaps found as its result', () => {
		const out = engine.assess!(view({ ...answered({}), t_sicherung: 'nein' }))!;
		expect(out.headline.de).toBe('1 Lücke gefunden.');
		expect(out.reasons[0].text.de).toContain('Wiederherstellung');
	});

	it('names the appointment threshold from 20 staff', () => {
		const notes = engine.assess!(view({ beschaeftigte: 25 }))!.notes ?? [];
		expect(notes.map((n) => n.de).join(' ')).toContain('§ 38 Abs. 1 BDSG');
	});

	it('closes with gaps once every point is answered and the report is dated', () => {
		const withGaps = { ...answered({}, 'nein'), bericht_am: '2026-12-01' };
		expect(applyTransition(definition, view(withGaps), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
		expect(
			applyTransition(definition, view({ bericht_am: '2026-12-01' }), 'abgeschlossen')
		).toMatchObject({ error: 'blocked' });
	});
});
