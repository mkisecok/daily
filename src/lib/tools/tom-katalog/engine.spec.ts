import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine, GOALS, reviewOutdated } from './engine.js';

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
const organised: RecordData = {
	verfuegbarkeit_massnahmen: ['backup', 'wiederherstellung', 'monitoring'],
	organisation_massnahmen: ['schulung', 'datenpannen']
};
const complete: RecordData = {
	...baseline,
	datenminimierung_massnahmen: ['loeschroutinen'],
	nichtverkettung_massnahmen: ['zwecktrennung'],
	transparenz_massnahmen: ['dokumentation'],
	intervenierbarkeit_massnahmen: ['betroffenenprozess'],
	...organised
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('TOM-Katalog', () => {
	// the checks read the age of the last review against today
	beforeAll(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
	});
	afterAll(() => {
		vi.useRealTimers();
	});

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

	it('adds a review a year after the last one when no date is set', () => {
		expect(engine.deadlines!(view({ geprueft_am: '2026-09-01' }))).toEqual([
			expect.objectContaining({ kind: 'wiedervorlage', dueAt: '2027-09-01T07:00:00.000Z' })
		]);
	});

	it('turns open measures with a date into a deadline', () => {
		const open = { offene_massnahmen: 'Datenbank verschlüsseln', offen_bis: '2027-01-31' };
		expect(engine.deadlines!(view(open))).toEqual([
			expect.objectContaining({ kind: 'massnahme', dueAt: '2027-01-31T08:00:00.000Z' })
		]);
		expect(engine.deadlines!(view({ offen_bis: '2027-01-31' }))).toEqual([]);
	});

	it('flags a review older than twelve months', () => {
		const old = { geprueft_am: '2025-11-01' };
		expect(reviewOutdated(view(old))).toBe(true);
		expect(reviewOutdated(view({ geprueft_am: '2025-11-24' }))).toBe(false);
		const result = assess({ ...complete, ...old });
		expect(result.outcome).toBe('luecken');
		expect(result.reasons[0]?.text.de).toContain('mehr als zwölf Monate');
	});

	it('asks for resilience: a gap for a high protection requirement, a note otherwise', () => {
		const without = { ...complete, verfuegbarkeit_massnahmen: ['backup', 'wiederherstellung'] };
		expect(notes(without)).toContain('Belastbarkeit');
		const high = assess({
			...without,
			schutzbedarf: 'hoch',
			vertraulichkeit_massnahmen: ['authentisierung', 'mfa', 'ruhe']
		});
		expect(high.reasons.map((r) => r.questionId)).toEqual(['belastbarkeit']);
	});

	it('names what a very high protection requirement still lacks', () => {
		const result = notes({
			...complete,
			schutzbedarf: 'sehr_hoch',
			vertraulichkeit_massnahmen: ['authentisierung', 'mfa', 'ruhe']
		});
		expect(result).toContain('Pseudonymisierung, Notfallplan, Auswertung der Protokolle fehlt');
	});

	it('asks for staff training and a breach process', () => {
		const result = notes({ ...complete, organisation_massnahmen: [] });
		expect(result).toContain('Schulung');
		expect(result).toContain('Datenpannen');
	});

	it('questions the status "Umgesetzt" while measures are open', () => {
		expect(notes({ ...complete, offene_massnahmen: 'Datenbank verschlüsseln' })).toContain(
			'„Umgesetzt“'
		);
		expect(notes({ ...complete, status: 'teilweise', offene_massnahmen: 'X' })).toBe('');
	});
});
