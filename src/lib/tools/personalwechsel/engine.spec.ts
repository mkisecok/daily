import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { definition, engine } from './engine.js';

const consent = (verdict: 'positive' | 'conditional' | 'negative') => ({
	tool: 'einwilligung-check',
	catalogVersion: 1,
	verdict,
	headline: { de: `Einwilligung ${verdict}`, en: `Consent ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'offen') => ({
	state,
	data: validateRecord(definition, { person: 'P-1042', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
/** every applicable point answered ja */
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja']))
});

describe('Eintritt und Austritt von Beschäftigten', () => {
	it('asks for the event first', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'unvollstaendig' });
	});

	it('applies the part of the event and the points the scope names', () => {
		expect(ids({ vorgang: 'eintritt' })).toContain('e_vertraulichkeit');
		expect(ids({ vorgang: 'eintritt' })).not.toContain('a_konten');
		expect(ids({ vorgang: 'eintritt' })).not.toContain('e_foto');
		expect(ids({ vorgang: 'eintritt', umfang: ['fotos', 'ki'] })).toEqual(
			expect.arrayContaining(['e_foto', 'e_ki'])
		);
		expect(ids({ vorgang: 'austritt', umfang: ['admin'] })).toEqual(
			expect.arrayContaining(['a_konten', 'a_admin', 'a_fristen'])
		);
		expect(ids({ vorgang: 'austritt' })).not.toContain('a_admin');
		expect(ids({ vorgang: 'wechsel' })).toEqual(['w_rechte', 'w_unterweisung', 'w_verzeichnisse']);
		expect(ids({ vorgang: 'wechsel', umfang: ['besondere'] })).toContain('k_getrennt');
	});

	it('stays at 30 points at most for the widest scope', () => {
		const all = ['privatnutzung', 'admin', 'geraete', 'fotos', 'besondere', 'ki'];
		expect(ids({ vorgang: 'eintritt', umfang: all }).length).toBeLessThanOrEqual(30);
		expect(ids({ vorgang: 'austritt', umfang: all }).length).toBeLessThanOrEqual(30);
	});

	it('names gaps with their part', () => {
		const result = assess({ ...allDone({ vorgang: 'austritt' }), a_konten: 'nein' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons[0].text.de).toBe(
			'Austritt: Konten und Zugänge zum letzten Arbeitstag gesperrt'
		);
	});

	it('wants the consent check for a published photo, and a failed one is a gap', () => {
		const base = allDone({ vorgang: 'eintritt', umfang: ['fotos'] });
		const without = assess(base);
		expect(without.outcome).toBe('offen');
		expect(without.notes!.some((n) => n.de.includes('Einwilligungs-Check'))).toBe(true);
		expect(assess({ ...base, foto_check: consent('positive') }).reasons[0].questionId).toBe(
			'foto_check'
		);
		expect(assess({ ...base, foto_check: consent('negative') }).outcome).toBe('abschliessbar');
	});

	it('points to data subject requests when someone leaves', () => {
		expect(
			assess(allDone({ vorgang: 'austritt' })).notes!.some((n) =>
				n.de.includes('Betroffenenanfrage')
			)
		).toBe(true);
	});

	it('closes only when the checklist and the consent check are complete', () => {
		const ready = {
			...allDone({ vorgang: 'eintritt', umfang: ['fotos'] }),
			abschluss_am: '2026-11-20'
		};
		expect(applyTransition(definition, view(ready), 'abgeschlossen')).toMatchObject({
			error: 'blocked'
		});
		const checked = { ...ready, foto_check: consent('negative') };
		expect(
			applyTransition(definition, view({ ...checked, e_akte: 'nein' }), 'abgeschlossen')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(checked), 'abgeschlossen')).toEqual({
			ok: true,
			state: 'abgeschlossen'
		});
	});

	it('sets the working day, the deletion review and gaps with a due date as deadlines', () => {
		const data = {
			vorgang: 'austritt',
			stichtag: '2026-12-31',
			a_rueckgabe: 'nein',
			a_rueckgabe_frist: '2027-01-08',
			loeschung_ab: '2033-01-01'
		};
		const open = engine.deadlines!(view(data));
		expect(open.map((d) => d.kind)).toEqual(['stichtag', 'luecke-a_rueckgabe']);
		expect(open[0].label.de).toContain('Letzter Arbeitstag');
		expect(engine.deadlines!(view(data, 'abgeschlossen')).map((d) => d.kind)).toEqual([
			'loeschung',
			'luecke-a_rueckgabe'
		]);
	});
});
