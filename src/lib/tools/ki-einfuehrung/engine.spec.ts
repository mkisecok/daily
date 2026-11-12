import { describe, expect, it } from 'vitest';
import { applyTransition } from '../../records/workflow.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { checklist } from '../_shared/occasion.js';
import { BLOCKS } from './definition.js';
import { definition, engine } from './engine.js';

const risk = (
	outcome: string,
	verdict: 'positive' | 'conditional' | 'negative' = 'conditional'
) => ({
	tool: 'risikoklassifizierung',
	catalogVersion: 1,
	verdict,
	outcome,
	headline: { de: outcome, en: outcome },
	at: '2026-11-12T09:00:00.000Z'
});
const view = (data: RecordData, state = 'pruefung') => ({
	state,
	data: validateRecord(definition, { bezeichnung: 'Copilot', ...data }).data
});
const assess = (data: RecordData) => engine.assess!(view(data))!;
const points = (data: RecordData) =>
	checklist(view(data).data, BLOCKS).points.map(({ item }) => item.id);
const allDone = (data: RecordData): RecordData => ({
	...data,
	...Object.fromEntries(points(data).map((id) => [id, 'ja']))
});

describe('KI-Tool einführen', () => {
	it('stops at a prohibited practice and blocks the approval', () => {
		const data = { umfang: ['beschaeftigte'], einstufung: risk('verboten', 'positive') };
		expect(assess(data)).toMatchObject({ verdict: 'positive', outcome: 'verboten' });
		expect(
			applyTransition(
				definition,
				view({ ...allDone(data), freigabe_am: '2026-12-01' }),
				'freigegeben'
			)
		).toMatchObject({
			error: 'blocked'
		});
	});

	it('adds the high-risk duties only for a high-risk classification', () => {
		const scope = { umfang: ['entscheidungen'] };
		expect(points(scope)).not.toContain('h_betreiber');
		expect(points({ ...scope, einstufung: risk('hochrisiko', 'positive') })).toEqual(
			expect.arrayContaining([
				'h_betreiber',
				'h_aufsicht',
				'h_beschaeftigte',
				'h_grundrechte',
				'e_mensch'
			])
		);
		expect(
			assess({ ...scope, einstufung: risk('hochrisiko', 'positive') }).notes!.some((n) =>
				n.de.includes('2. Dezember 2027')
			)
		).toBe(true);
	});

	it('applies transparency by what the tool does', () => {
		expect(points({ umfang: ['kontakt'] })).toContain('t_hinweis');
		expect(points({ umfang: ['kontakt'] })).not.toContain('t_kennzeichnung');
		expect(points({ umfang: ['inhalte'] })).toContain('t_kennzeichnung');
	});

	it('wants the risk classification, and for personal data the DPIA screening and the GDPR check', () => {
		const result = assess(allDone({ umfang: ['personenbezug'] }));
		expect(result.outcome).toBe('offen');
		expect(result.notes!.find((n) => n.de.startsWith('Noch durchzuführen'))!.de).toBe(
			'Noch durchzuführen: Risikoklassifizierung, DSFA-Schwellwertanalyse, KI und DSGVO.'
		);
	});

	it('is ready for approval with every point done and the checks on file', () => {
		const data = {
			...allDone({ umfang: ['beschaeftigte'], einstufung: risk('minimal', 'negative') }),
			ki_register: 'ki-1'
		};
		expect(assess(data)).toMatchObject({ verdict: 'negative', outcome: 'freigabefaehig' });
		expect(
			applyTransition(definition, view({ ...data, freigabe_am: '2026-12-01' }), 'freigegeben')
		).toEqual({
			ok: true,
			state: 'freigegeben'
		});
	});

	it('points to the software tool when the system is not AI under the AI Act', () => {
		expect(
			assess({ umfang: ['beschaeftigte'], einstufung: risk('kein-ki', 'negative') }).notes!.some(
				(n) => n.de.includes('Neue Software einführen')
			)
		).toBe(true);
	});
});
