import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const snap = (
	tool: string,
	verdict: 'positive' | 'conditional' | 'negative',
	outcome?: string
) => ({
	tool,
	catalogVersion: 1,
	verdict,
	...(outcome ? { outcome } : {}),
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const high = snap('risikoklassifizierung', 'positive', 'hochrisiko');
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Schichtplanung', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const ready = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	dsfa_check: snap('dsfa-schwellwert', 'negative'),
	register: 'ki-1'
});

describe('KI im Personalbereich', () => {
	it('adds the Art. 26 duties only for a high-risk classification', () => {
		expect(ids({})).not.toContain('h_aufsicht');
		expect(ids({ einstufung: high })).toEqual(
			expect.arrayContaining(['h_anleitung', 'h_aufsicht', 'h_ueberwachung', 'h_protokolle'])
		);
	});

	it('asks for the FRIA only from public bodies with a high-risk system', () => {
		expect(ids({ umfang: ['oeffentlich'] })).not.toContain('f_grfa');
		expect(ids({ umfang: ['oeffentlich'], einstufung: high })).toContain('f_grfa');
		expect(ids({ einstufung: high })).not.toContain('f_grfa');
	});

	it('applies the works council part and the selection guidelines by scope', () => {
		expect(ids({ umfang: ['betriebsrat'] })).toEqual(
			expect.arrayContaining(['b_unterrichtung', 'b_mitbestimmung', 'b_sachverstand'])
		);
		expect(ids({ umfang: ['betriebsrat'] })).not.toContain('b_richtlinien');
		expect(ids({ umfang: ['betriebsrat', 'richtlinien'] })).toContain('b_richtlinien');
		expect(ids({ umfang: SCOPES.map((s) => s.value), einstufung: high })).toHaveLength(17);
	});

	it('stops at a prohibited practice', () => {
		const data = ready({ einstufung: snap('risikoklassifizierung', 'positive', 'verboten') });
		const out = assess(data);
		expect(out).toMatchObject({ outcome: 'verboten', headline: { de: 'Einsatz nicht zulässig.' } });
		expect(
			applyTransition(definition, view({ ...data, freigabe_am: '2027-01-01' }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
	});

	it('wants the classification and the screening, and the DPIA when it says so', () => {
		expect(assess({}).notes).toContainEqual({
			de: 'Noch durchzuführen: Risikoklassifizierung, DSFA-Schwellwertanalyse.',
			en: 'Still to run: risk classification, DPIA screening.'
		});
		const needsDpia = ready({ einstufung: high, dsfa_check: snap('dsfa-schwellwert', 'positive') });
		expect(
			assess({ ...needsDpia, dsfa_check: snap('dsfa-schwellwert', 'positive') }).reasons[0]
				.questionId
		).toBe('dsfa');
	});

	it('approves a high-risk system once its duties and checks are done', () => {
		const data = { ...ready({ einstufung: high }), freigabe_am: '2027-01-01' };
		expect(assess(data).notes!.some((n) => n.de.includes('2. Dezember 2027'))).toBe(true);
		expect(
			applyTransition(definition, view({ ...data, h_aufsicht: 'nein' }), 'freigegeben')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(data), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});
});
