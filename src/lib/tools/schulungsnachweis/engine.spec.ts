import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const session: RecordData = {
	titel: 'Jahresunterweisung 2026',
	datum: '2026-08-31',
	themen: ['grundlagen', 'pannen'],
	nachweis: 'liste',
	vertraulichkeit: 'true',
	wiederholung_monate: '12'
};

const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Schulungsnachweis', () => {
	it('derives the repetition deadline from date and interval', () => {
		expect(engine.deadlines!(view(session))).toEqual([
			expect.objectContaining({ kind: 'wiederholung', dueAt: '2027-08-31T07:00:00.000Z' })
		]);
		expect(engine.deadlines!(view({ ...session, wiederholung_monate: '6' }))[0].dueAt).toBe(
			'2027-02-28T08:00:00.000Z'
		);
		expect(engine.deadlines!(view({ ...session, wiederholung_monate: '' }))).toEqual([]);
	});

	it('accepts a documented session without further points', () => {
		expect(assess(session)).toMatchObject({ verdict: 'negative', outcome: 'dokumentiert' });
	});

	it('flags a session without evidence', () => {
		expect(assess({ ...session, nachweis: 'keiner' })).toMatchObject({
			verdict: 'positive',
			outcome: 'ohne-nachweis'
		});
	});

	it('suggests interval, breach reporting, confidentiality and AI literacy', () => {
		expect(notes({ ...session, wiederholung_monate: '' })).toContain('12 bis 24 Monate');
		expect(notes({ ...session, themen: ['grundlagen'] })).toContain('72-Stunden-Frist');
		expect(notes({ ...session, vertraulichkeit: 'false' })).toContain('Art. 32 Abs. 4');
		expect(notes({ ...session, themen: ['pannen', 'ki'] })).toContain('Art der Befassung');
	});

	it('checks the AI content against the kind of involvement (Art. 4 KI-VO)', () => {
		const base = {
			titel: 'KI im Alltag',
			datum: '2026-09-15',
			nachweis: 'liste',
			themen: ['ki'],
			ki_befassung: 'anwendung',
			ki_inhalte: ['risiken']
		};
		const out = engine.assess!({ state: null, data: base } as never)!;
		expect(out.verdict).not.toBe('positive');
		expect((out.notes ?? []).map((n) => n.de).join(' ')).toContain('nicht behandelt');
	});

	it('treats missing oversight content as a gap (Art. 26 Abs. 2 KI-VO)', () => {
		const out = engine.assess!({
			state: null,
			data: {
				titel: 'Aufsicht Bewerberauswahl',
				datum: '2026-09-15',
				nachweis: 'liste',
				themen: ['ki'],
				ki_befassung: 'aufsicht',
				ki_inhalte: ['risiken']
			}
		} as never)!;
		expect(out.headline.de).toBe('Kompetenz für die Aufsicht nicht belegt.');
		expect(out.reasons).toHaveLength(2);
	});
});
