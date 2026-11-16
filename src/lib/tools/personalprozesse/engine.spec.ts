import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { applyTransition } from '../../records/workflow.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const view = (data: RecordData, state = 'entwurf') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Personal', ...data }).data
});
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja']))
});

describe('Personalprozesse', () => {
	it('keeps every point of both former tools, the legal basis once', () => {
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(45);
		expect(ids({}).filter((id) => id.endsWith('rechtsgrundlage'))).toEqual(['r_rechtsgrundlage']);
	});

	it('separates AI in selection from staff working with AI', () => {
		expect(ids({ umfang: ['ki'] })).toContain('b_k_mensch');
		expect(ids({ umfang: ['ki'] })).not.toContain('e_ki');
		expect(ids({ umfang: ['ki_arbeit'] })).toContain('e_ki');
	});

	it('names gaps with their part and is put in place once complete', () => {
		const out = engine.assess!(view({ ...allDone({}), a_konten: 'nein' }))!;
		expect(out.reasons[0].text.de).toMatch(/^Austritt: /);
		expect(
			applyTransition(
				definition,
				view({ ...allDone({}), eingefuehrt_am: '2026-12-01' }),
				'eingefuehrt'
			)
		).toEqual({ ok: true, state: 'eingefuehrt' });
	});
});
