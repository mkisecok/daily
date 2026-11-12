import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS, SCOPES } from './definition.js';
import { definition, engine } from './engine.js';

const snap = (tool: string, verdict: 'positive' | 'negative', outcome?: string) => ({
	tool,
	catalogVersion: 1,
	verdict,
	...(outcome ? { outcome } : {}),
	headline: { de: `${tool} ${verdict}`, en: `${tool} ${verdict}` },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Shop-Bot', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const ids = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const ready = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(ids(data).map((id) => [id, 'ja'])),
	einstufung: snap('risikoklassifizierung', 'positive', 'art50'),
	// Art. 50 duties apply to every chatbot; that is not a gap
	ki_check: snap('transparenzpflichten', 'positive'),
	register: 'ki-1'
});

describe('Chatbot auf der Website', () => {
	it('applies the core points always and the rest by scope', () => {
		expect(ids({})).toHaveLength(12);
		expect(ids({})).not.toContain('a_drittland');
		expect(ids({ umfang: ['drittland'] })).toContain('a_drittland');
		expect(ids({ umfang: ['entscheidungen'] })).toContain('x_mensch');
		expect(ids({ umfang: SCOPES.map((s) => s.value) })).toHaveLength(14);
	});

	it('wants the classification and the transparency check, and the transfer check outside the EEA', () => {
		expect(assess({ umfang: ['drittland'] }).notes).toContainEqual({
			de: 'Noch durchzuführen: Risikoklassifizierung, Prüfung der Transparenzpflichten, Drittlandprüfung.',
			en: 'Still to run: risk classification, transparency duties check, third-country check.'
		});
	});

	it('treats a missing notice and a transfer without a basis as gaps, not the Art. 50 duty itself', () => {
		const base = ready({ umfang: ['drittland'] });
		const withTransfer = { ...base, transfer_check: snap('drittland-transfer', 'negative') };
		expect(assess(withTransfer).outcome).toBe('startklar');
		expect(
			assess({ ...base, transfer_check: snap('drittland-transfer', 'positive') }).reasons[0]
				.questionId
		).toBe('transfer_check');
		expect(assess({ ...withTransfer, t_hinweis: 'nein' }).reasons[0].text.de).toContain(
			'Transparenz: Klar erkennbar und barrierefrei'
		);
	});

	it('blocks a prohibited practice', () => {
		const data = {
			...ready({}),
			einstufung: snap('risikoklassifizierung', 'positive', 'verboten'),
			freigabe_am: '2027-01-01'
		};
		expect(assess(data).outcome).toBe('verboten');
		expect(applyTransition(definition, view(data), 'freigegeben')).toMatchObject({
			error: 'blocked'
		});
	});

	it('approves once the checklist and the checks are done', () => {
		const data = { ...ready({}), freigabe_am: '2027-01-01' };
		expect(
			applyTransition(definition, view({ ...data, ki_check: null }), 'freigegeben')
		).toMatchObject({
			error: 'blocked'
		});
		expect(applyTransition(definition, view(data), 'freigegeben')).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});
});
