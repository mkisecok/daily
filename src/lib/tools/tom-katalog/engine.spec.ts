import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine, GOALS } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const baseline: RecordData = {
	system: 'Personalverwaltung',
	schutzbedarf: 'normal',
	status: 'umgesetzt',
	vertraulichkeit_massnahmen: ['authentisierung', 'rollen', 'transport'],
	integritaet_massnahmen: ['protokoll'],
	verfuegbarkeit_massnahmen: ['backup', 'wiederherstellung'],
	geprueft_am: '2026-09-01'
};
const complete: RecordData = {
	...baseline,
	datenminimierung_massnahmen: ['loeschroutinen'],
	nichtverkettung_massnahmen: ['zwecktrennung'],
	transparenz_massnahmen: ['dokumentation'],
	intervenierbarkeit_massnahmen: ['betroffenenprozess']
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('TOM-Katalog', () => {
	it('structures the measures by the seven SDM protection goals', () => {
		expect(GOALS.map((g) => g.id)).toEqual([
			'vertraulichkeit',
			'integritaet',
			'verfuegbarkeit',
			'datenminimierung',
			'nichtverkettung',
			'transparenz',
			'intervenierbarkeit'
		]);
	});

	it('reports Art. 32(1)(b)–(d) gaps for an empty entry', () => {
		const result = assess({ system: 'X', schutzbedarf: 'normal', status: 'entwurf' });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons.map((r) => r.cite?.ref)).toEqual([
			'Art. 32 Abs. 1 lit. b',
			'Art. 32 Abs. 1 lit. b',
			'Art. 32 Abs. 1 lit. b',
			'Art. 32 Abs. 1 lit. c',
			'Art. 32 Abs. 1 lit. d'
		]);
	});

	it('needs both backups and a tested restore for Art. 32(1)(c)', () => {
		const result = assess({ ...complete, verfuegbarkeit_massnahmen: ['backup'] });
		expect(result.reasons.map((r) => r.questionId)).toEqual(['wiederherstellung']);
	});

	it('names empty SDM goals and accepts a complete entry', () => {
		expect(notes(baseline)).toContain(
			'Datenminimierung, Nichtverkettung, Transparenz, Intervenierbarkeit'
		);
		expect(assess(baseline).outcome).toBe('hinweise');
		expect(assess(complete)).toMatchObject({ verdict: 'negative', outcome: 'belegt' });
	});

	it('expects encryption or pseudonymisation and MFA for high protection requirements', () => {
		expect(notes({ ...complete, vertraulichkeit_massnahmen: ['rollen'] })).toContain(
			'Art. 32 Abs. 1 lit. a'
		);
		const high = notes({ ...complete, schutzbedarf: 'hoch' });
		expect(high).toContain('Mehr-Faktor');
		expect(high).toContain('gespeicherter Daten');
		expect(
			notes({
				...complete,
				schutzbedarf: 'hoch',
				vertraulichkeit_massnahmen: ['authentisierung', 'rollen', 'transport', 'mfa', 'ruhe']
			})
		).toBe('');
	});

	it('turns the review date into a deadline', () => {
		expect(engine.deadlines!(view({ wiedervorlage: '2027-09-01' }))).toEqual([
			expect.objectContaining({ kind: 'wiedervorlage', dueAt: '2027-09-01T07:00:00.000Z' })
		]);
	});
});
