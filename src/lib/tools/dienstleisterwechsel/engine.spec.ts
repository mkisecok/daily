import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const transfer = (verdict: 'positive' | 'negative') => ({
	tool: 'drittland-transfer',
	catalogVersion: 1,
	verdict,
	headline: { de: `Transfer ${verdict}`, en: `Transfer ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'geplant') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Lohnbüro', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	avv_neu: 'avv-2'
});

describe('Dienstleister wechseln oder Vertrag beenden', () => {
	it('applies return and deletion always and the rest by scope', () => {
		expect(ids({})).toEqual([
			'k_bestand',
			'k_vertrag',
			'k_wahl',
			'u_sicherung',
			'u_rueckgabe',
			'l_bestaetigung',
			'l_unterauftrag',
			'd_vvt',
			'd_hinweise',
			'd_ablage'
		]);
		expect(ids({ umfang: ['cloud'] })).toEqual(expect.arrayContaining(['c_frist', 'c_entgelt']));
		expect(ids({ umfang: ['neu'] })).not.toContain('n_drittland');
		expect(ids({ umfang: ['neu', 'drittland'] })).toContain('n_drittland');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(19);
	});

	it('wants the third-country check for a provider outside the EEA, and a missing basis is a gap', () => {
		const base = allDone({ umfang: ['neu', 'drittland'] });
		expect(assess(base).outcome).toBe('offen');
		expect(assess({ ...base, transfer_check: transfer('positive') }).reasons[0].questionId).toBe(
			'transfer_check'
		);
		expect(assess({ ...base, transfer_check: transfer('negative') }).outcome).toBe('abschliessbar');
	});

	it('names a missing deletion confirmation as a gap', () => {
		const result = assess({ ...allDone({}), l_bestaetigung: 'nein' });
		expect(result.reasons[0].text.de).toBe(
			'Löschung beim bisherigen Dienstleister: Schriftliche Bestätigung der Löschung, auch für Kopien und Sicherungen'
		);
	});

	it('closes only from the switch, with the checklist done', () => {
		const ready = { ...allDone({ umfang: ['zugang'] }), abschluss_am: '2027-01-31' };
		expect(applyTransition(definition, view(ready), 'abgeschlossen')).toMatchObject({
			error: expect.any(String)
		});
		expect(
			applyTransition(
				definition,
				view({ ...ready, u_zugaenge: 'nein' }, 'umstellung'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(ready, 'umstellung'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the notice date while planned and the contract end until closed', () => {
		const data = { kuendigung_bis: '2026-12-31', vertragsende: '2027-03-31' };
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'kuendigung',
			'vertragsende'
		]);
		expect(engine.deadlines!(view(data, 'umstellung')).map((d) => d.kind)).toEqual([
			'vertragsende'
		]);
		expect(engine.deadlines!(view(data, 'abgeschlossen'))).toEqual([]);
	});
});
