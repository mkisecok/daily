import { describe, expect, it } from 'vitest';
import { validateRecord } from '../../records/validate.js';
import { definition } from './definition.js';
import { dsfaParts } from './print.js';

const view = (data: Record<string, unknown>) => ({
	state: 'entwurf',
	data: validateRecord(definition, { bezeichnung: 'Videoüberwachung', ...data }).data
});

describe('DSFA report', () => {
	it('follows Art. 35 Abs. 7 and lists rated risks before and after measures', () => {
		const parts = dsfaParts(
			view({
				vertraulichkeit_w: '2',
				vertraulichkeit_s: '3',
				vertraulichkeit_massnahmen: 'Verschlüsselung',
				vertraulichkeit_rw: '1',
				vertraulichkeit_rs: '1'
			}),
			'de'
		);
		expect(parts.map((part) => part.id)).toEqual([
			'gegenstand',
			'beschreibung',
			'notwendigkeit',
			'risiken',
			'massnahmen',
			'beteiligung',
			'ergebnis'
		]);
		const risks = parts.find((part) => part.id === 'risiken')!.rows;
		expect(risks[0]).toMatchObject({ label: 'Unbefugte Offenlegung' });
		expect(risks[0].value).toContain(
			'Einstufung: Risiko (Wahrscheinlichkeit Überschaubar, Schwere Substanziell)'
		);
		expect(risks.at(-1)).toMatchObject({ label: 'Nicht bewertet' });
		expect(risks.at(-1)!.value).not.toContain('Unbefugte Offenlegung');
		const measures = parts.find((part) => part.id === 'massnahmen')!.rows;
		expect(measures[0].value).toContain('Nach Maßnahmen: Geringes Risiko');
	});

	it('says whether the authority must be consulted when no consultation is recorded', () => {
		const outcome = (data: Record<string, unknown>) =>
			dsfaParts(view(data), 'de')
				.find((part) => part.id === 'ergebnis')!
				.rows.find((row) => row.label.startsWith('Konsultation der Aufsichtsbehörde'))?.value;
		expect(outcome({})).toBe('Nicht erforderlich: kein hohes Restrisiko.');
		expect(outcome({ integritaet_w: '4', integritaet_s: '4' })).toBe(
			'Erforderlich, noch nicht erfolgt.'
		);
	});
});
