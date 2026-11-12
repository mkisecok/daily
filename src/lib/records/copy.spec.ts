import { describe, expect, it } from 'vitest';
import { definition } from '../tools/software-einfuehrung/definition.js';
import { copyData } from './copy.js';

const snapshot = {
	tool: 'dsfa-schwellwert',
	catalogVersion: 1,
	verdict: 'negative' as const,
	headline: { de: 'Keine DSFA erforderlich.', en: 'No DPIA required.' },
	at: '2026-11-12T09:00:00.000Z'
};

describe('copying an entry', () => {
	const data = {
		bezeichnung: 'Personio',
		anbieter: 'Personio SE',
		umfang: ['personenbezug', 'cloud'],
		einsatz_ab: '2026-12-01',
		dsfa_check: snapshot,
		vvt: 'vvt-1',
		d_zweck: 'ja',
		d_zweck_notiz: 'erledigt',
		d_zweck_frist: '2026-11-30',
		freigabe_am: '2026-11-20'
	};

	it('keeps the description and links, marks the title as a copy', () => {
		expect(copyData(definition, data)).toEqual({
			bezeichnung: 'Personio (Kopie)',
			anbieter: 'Personio SE',
			umfang: ['personenbezug', 'cloud'],
			vvt: 'vvt-1'
		});
		expect(copyData(definition, data, 'en').bezeichnung).toBe('Personio (copy)');
	});

	it('leaves out dates, attached results and checklist answers with their notes', () => {
		const copy = copyData(definition, data);
		for (const id of [
			'einsatz_ab',
			'dsfa_check',
			'd_zweck',
			'd_zweck_notiz',
			'd_zweck_frist',
			'freigabe_am'
		])
			expect(copy).not.toHaveProperty(id);
	});
});
