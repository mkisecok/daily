import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { definition, engine, objectionEnds } from './engine.js';

const view = (data: RecordData, state = 'verhandlung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Kauf', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	vvt: 'vvt-1'
});

describe('Unternehmenskauf und Betriebsübergang', () => {
	it('asks for the deal type first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
		expect(ids({})).toEqual([]);
	});

	it('applies the DSK case groups only to an asset deal', () => {
		expect(ids({ art: 'asset' })).toEqual(
			expect.arrayContaining([
				'k_laufend',
				'k_anbahnung',
				'k_beendet',
				'k_forderungen',
				'k_einwilligung'
			])
		);
		expect(ids({ art: 'asset' })).not.toContain('k_einziges');
		expect(ids({ art: 'asset', umfang: ['nur_kunden'] })).toContain('k_einziges');
		expect(ids({ art: 'share' })).toContain('g_konzern');
		expect(ids({ art: 'share' })).not.toContain('k_laufend');
		expect(ids({ art: 'umwandlung' })).toContain('g_konzern');
	});

	it('counts the staff objection period from the day they were informed', () => {
		expect(
			objectionEnds(
				view({ art: 'asset', umfang: ['beschaeftigte'], unterrichtet_am: '2027-01-31' })
			)
		).toBe('2027-02-28');
		expect(objectionEnds(view({ art: 'asset', unterrichtet_am: '2027-01-31' }))).toBeNull();
		expect(
			assess({ art: 'asset', umfang: ['beschaeftigte'] }).notes!.some((n) =>
				n.de.includes('Datum der Unterrichtung')
			)
		).toBe(true);
	});

	it('names a personal data room as a gap', () => {
		const result = assess({ ...allDone({ art: 'asset' }), r_anonym: 'nein' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons[0].text.de).toBe(
			'Due Diligence: Angaben zu Kunden und Beschäftigten im Datenraum nur anonymisiert oder zusammengefasst'
		);
	});

	it('closes only after signing, with the checklist and the transfer check done', () => {
		const done = {
			...allDone({ art: 'share', umfang: ['drittland'] }),
			abschluss_am: '2027-03-01'
		};
		expect(applyTransition(definition, view(done), 'abgeschlossen')).toMatchObject({
			error: expect.any(String)
		});
		expect(applyTransition(definition, view(done, 'vollzug'), 'abgeschlossen')).toMatchObject({
			error: 'blocked'
		});
		const checked = {
			...done,
			transfer_check: {
				tool: 'drittland-transfer',
				catalogVersion: 1,
				verdict: 'negative' as const,
				headline: { de: 'ok', en: 'ok' },
				at: '2026-11-13T09:00:00.000Z'
			}
		};
		expect(applyTransition(definition, view(checked, 'vollzug'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the closing date and the objection period as deadlines while running', () => {
		const data = {
			art: 'asset',
			umfang: ['beschaeftigte'],
			vollzug_am: '2027-04-01',
			unterrichtet_am: '2027-02-15'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual(['vollzug', 'widerspruch']);
		expect(engine.deadlines!(view(data, 'abgeschlossen'))).toEqual([]);
	});
});
