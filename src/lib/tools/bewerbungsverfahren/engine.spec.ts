import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, deletionDue, engine } from './engine.js';

const classification = (outcome: string) => ({
	tool: 'risikoklassifizierung',
	catalogVersion: 1,
	verdict: 'positive' as const,
	outcome,
	headline: { de: outcome, en: outcome },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'laeuft') => ({
	state,
	data: validateRecord(definition, { stelle: 'Buchhaltung', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	avv: 'avv-1'
});

describe('Bewerbungsverfahren', () => {
	it('applies the core points always and the rest by scope', () => {
		expect(ids({})).toHaveLength(8);
		expect(ids({})).not.toContain('a_avv');
		expect(ids({ umfang: ['ki'] })).toEqual(expect.arrayContaining(['k_einstufung', 'k_mensch']));
		expect(ids({ umfang: ['betriebsrat'] })).toContain('s_betriebsrat');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(18);
	});

	it('counts the deletion from the rejection: two months to claim, three to sue', () => {
		expect(deletionDue('2026-11-30')).toBe('2027-05-30');
		expect(deletionDue(null)).toBeNull();
		expect(
			assess({ absagen_am: '2026-11-30' }).notes!.some((n) => n.de.includes('ab dem 30.05.2027'))
		).toBe(true);
	});

	it('wants the classification for AI, stops at a prohibited practice and names Art. 26 for high risk', () => {
		const base = allDone({ umfang: ['ki'] });
		expect(assess(base).outcome).toBe('offen');
		expect(assess({ ...base, einstufung: classification('verboten') }).reasons[0].questionId).toBe(
			'einstufung'
		);
		const high = assess({ ...base, einstufung: classification('hochrisiko') });
		expect(high.outcome).toBe('erledigt');
		expect(high.notes!.some((n) => n.de.includes('2. Dezember 2027'))).toBe(true);
	});

	it('names gaps with their part', () => {
		const result = assess({ ...allDone({ umfang: ['pool'] }), t_einwilligung: 'nein' });
		expect(result.reasons[0].text.de).toBe(
			'Talentpool: Einwilligung für den Talentpool getrennt eingeholt, freiwillig und widerruflich'
		);
	});

	it('closes only after the rejections, with the checklist done', () => {
		const done = { ...allDone({}), absagen_am: '2026-11-30', geloescht_am: '2027-06-01' };
		expect(applyTransition(definition, view(done), 'entschieden')).toEqual({
			ok: true,
			state: 'entschieden'
		});
		expect(
			applyTransition(
				definition,
				view({ ...done, e_loeschung: 'nein' }, 'entschieden'),
				'abgeschlossen'
			)
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(done, 'entschieden'), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the deletion date until closed, and gaps with a due date', () => {
		const data = { absagen_am: '2026-11-30', a_kanal: 'nein', a_kanal_frist: '2026-12-10' };
		expect(engine.deadlines!(view(data, 'entschieden')).map((d) => d.kind)).toEqual([
			'loeschung',
			'luecke-a_kanal'
		]);
		expect(engine.deadlines!(view(data, 'abgeschlossen')).map((d) => d.kind)).toEqual([
			'luecke-a_kanal'
		]);
	});
});
