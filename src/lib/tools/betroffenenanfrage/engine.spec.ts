import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { applyTransition } from '../../records/workflow.js';
import { definition, engine, replyDue } from './engine.js';

/** Saturday 31 January 2026, 10:00 in Berlin */
const RECEIVED = '2026-01-31T09:00:00.000Z';

function view(data: RecordData, state = 'in_bearbeitung') {
	return {
		state,
		data: validateRecord(definition, { eingang: RECEIVED, rechte: ['auskunft'], ...data }).data
	};
}

const kinds = (data: RecordData) => engine.deadlines!(view(data)).map((d) => d.kind);
const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Betroffenenanfrage: deadlines', () => {
	it('is due one month after the day of receipt, at the end of the month if shorter', () => {
		expect(replyDue(view({}))).toBe('2026-02-28T22:59:00.000Z');
	});

	it('extends to three months only once the extension is communicated', () => {
		expect(replyDue(view({ verlaengerung: 'true' }))).toBe('2026-02-28T22:59:00.000Z');
		expect(kinds({ verlaengerung: 'true' })).toEqual(['antwort', 'verlaengerung']);
		const extended = view({
			verlaengerung: 'true',
			verlaengerung_mitgeteilt_am: '2026-02-10T10:00:00.000Z'
		});
		expect(replyDue(extended)).toBe('2026-04-30T21:59:00.000Z');
		expect(engine.deadlines!(extended).map((d) => d.kind)).toEqual(['antwort']);
	});

	it('has no deadline once the reply is sent', () => {
		expect(kinds({ antwort_am: '2026-02-20T10:00:00.000Z' })).toEqual([]);
	});
});

describe('Betroffenenanfrage: assessment', () => {
	it('names the deadline while open', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
		expect(assess({}).headline.de).toBe('Antwort fällig bis 28.02.2026.');
	});

	it('tells a timely reply from a late one', () => {
		expect(assess({ antwort_am: '2026-02-27T10:00:00.000Z' }).outcome).toBe('fristgerecht');
		expect(assess({ antwort_am: '2026-03-02T10:00:00.000Z' })).toMatchObject({
			verdict: 'positive',
			outcome: 'verspaetet'
		});
	});

	it('lists the checklist for each right invoked, in article order', () => {
		const text = notes({ rechte: ['widerspruch', 'auskunft'] });
		expect(text.indexOf('Auskunft (Art. 15)')).toBeLessThan(text.indexOf('Widerspruch (Art. 21)'));
		expect(text).not.toContain('Löschung (Art. 17)');
	});

	it('reminds of Art. 19 until recipients are informed', () => {
		expect(notes({ rechte: ['loeschung'] })).toContain('(Art. 19)');
		expect(notes({ rechte: ['loeschung'], empfaenger_informiert: 'true' })).not.toContain(
			'vermerken (Art. 19)'
		);
	});

	it('flags identity, extension and refusal points', () => {
		expect(notes({ identitaet: 'angefordert' })).toContain('nicht abschließend geklärt');
		expect(notes({ verlaengerung: 'true' })).toContain('Gründe anzugeben');
		expect(
			notes({
				verlaengerung: 'true',
				verlaengerung_grund: 'Umfang',
				verlaengerung_mitgeteilt_am: '2026-03-05T10:00:00.000Z'
			})
		).toContain('nach Ablauf der Monatsfrist');
		expect(notes({ ablehnung: 'exzessiv' })).toContain('Art. 12 Abs. 4');
	});
});

describe('Betroffenenanfrage: workflow', () => {
	it('closes as answered only with measures and reply date, and not with doubtful identity', () => {
		expect(applyTransition(definition, view({}), 'beantwortet')).toMatchObject({
			error: 'missing',
			missing: ['massnahmen', 'antwort_am']
		});
		const done = { massnahmen: 'Auskunft erteilt', antwort_am: '2026-02-20T10:00:00.000Z' };
		expect(applyTransition(definition, view(done), 'beantwortet')).toEqual({
			ok: true,
			state: 'beantwortet'
		});
		expect(
			applyTransition(definition, view({ ...done, identitaet: 'zweifel' }), 'beantwortet')
		).toMatchObject({ error: 'blocked' });
	});

	it('refuses only with a reason, its grounds and the reply date', () => {
		expect(applyTransition(definition, view({}), 'abgelehnt')).toMatchObject({
			missing: ['ablehnung', 'ablehnung_grund', 'antwort_am']
		});
	});
});
