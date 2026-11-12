import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const snapshot = (tool: string, verdict: 'positive' | 'conditional' | 'negative') => ({
	tool,
	catalogVersion: 1,
	verdict,
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'beispiel.de', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	avv: 'avv-1'
});

describe('Website oder Shop starten', () => {
	it('applies the basics always and the rest by scope', () => {
		expect(ids({})).toEqual([
			'g_impressum',
			'g_datenschutz',
			'g_inventar',
			'g_hosting',
			'g_https',
			'g_logs',
			'r_vvt',
			'r_dsb'
		]);
		expect(ids({ umfang: ['tracking'] })).toEqual(
			expect.arrayContaining(['c_ablehnen', 'd_rolle', 'r_test'])
		);
		expect(ids({ umfang: ['tracking'] })).not.toContain('d_klick');
		expect(ids({ umfang: ['einbindungen'] })).toEqual(
			expect.arrayContaining(['d_lokal', 'd_klick'])
		);
		expect(ids({ umfang: ['konten'] })).toEqual(expect.arrayContaining(['s_konto']));
		expect(ids({ umfang: ['konten'] })).not.toContain('s_gast');
	});

	it('stays at 30 points for the widest scope', () => {
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(30);
	});

	it('wants the checks the scope names, and treats invalid consent as a gap', () => {
		const base = allDone({ umfang: ['tracking', 'drittland', 'chatbot'] });
		const open = assess(base);
		expect(open.outcome).toBe('offen');
		expect(open.notes).toContainEqual({
			de: 'Noch durchzuführen: Einwilligungs-Check für das Banner, Drittlandprüfung, Prüfung der Transparenzpflichten.',
			en: 'Still to run: consent check for the banner, third-country check, transparency duties check.'
		});
		const checked = {
			...base,
			consent_check: snapshot('einwilligung-check', 'negative'),
			transfer_check: snapshot('drittland-transfer', 'negative'),
			// Art. 50 duties apply to every chatbot; that is not a gap
			ki_check: snapshot('transparenzpflichten', 'positive')
		};
		expect(assess(checked).outcome).toBe('startklar');
		const invalid = assess({
			...checked,
			consent_check: snapshot('einwilligung-check', 'positive')
		});
		expect(invalid.outcome).toBe('luecken');
		expect(invalid.reasons[0].questionId).toBe('consent_check');
	});

	it('names gaps with their part and points chatbots to the chatbot tool', () => {
		const result = assess({ ...allDone({ umfang: ['chatbot'] }), k_hinweis: 'nein' });
		expect(result.reasons[0].text.de).toBe(
			'KI-Chatbot: Klarer Hinweis, dass man mit einer KI schreibt (Werkzeug Transparenzpflichten)'
		);
		expect(result.notes!.some((n) => n.de.includes('Chatbot auf der Website'))).toBe(true);
	});

	it('approves only when the checklist and the checks needed are complete', () => {
		const ready = { ...allDone({ umfang: ['tracking'] }), freigabe_am: '2026-11-20' };
		expect(applyTransition(definition, view(ready), 'freigegeben')).toMatchObject({
			error: 'blocked'
		});
		const checked = { ...ready, consent_check: snapshot('einwilligung-check', 'negative') };
		expect(
			applyTransition(definition, view({ ...checked, c_ablehnen: 'nein' }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(checked), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('sets the launch, the review and gaps with a due date as deadlines', () => {
		const data = {
			start_am: '2026-12-01',
			g_impressum: 'nein',
			g_impressum_frist: '2026-11-25',
			wiedervorlage: '2027-06-01'
		};
		expect(engine.deadlines!(view(data)).map((d) => d.kind)).toEqual([
			'start',
			'luecke-g_impressum'
		]);
		expect(engine.deadlines!(view(data, 'freigegeben')).map((d) => d.kind)).toEqual([
			'wiedervorlage',
			'luecke-g_impressum'
		]);
	});
});
