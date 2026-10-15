import { describe, expect, it } from 'vitest';
import { formatTime } from '../../i18n/date.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { allowedTransitions, applyTransition } from '../../records/workflow.js';
import { definition, engine, notificationDue } from './engine.js';

/** Saturday 24 October 2026, 10:00 in Berlin; daylight saving ends the next night */
const AWARE = '2026-10-24T08:00:00.000Z';

function view(data: RecordData, state = 'erfasst') {
	return { state, data: validateRecord(definition, { kenntnis: AWARE, ...data }).data };
}

const kinds = (data: RecordData, state?: string) =>
	engine.deadlines!(view(data, state)).map((d) => d.kind);
const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Datenpanne: deadlines', () => {
	it('runs 72 hours in absolute time across the end of daylight saving', () => {
		const due = notificationDue(view({}))!;
		expect(due).toBe('2026-10-27T08:00:00.000Z');
		// 10:00 CEST on Saturday becomes 09:00 CET on Tuesday on the wall clock
		expect(formatTime(due, 'de')).toBe('09:00');
	});

	it('starts the authority clock before the risk is assessed', () => {
		expect(kinds({})).toEqual(['meldung-aufsicht']);
	});

	it('stops the clock for "no risk" and once the notification is entered', () => {
		expect(kinds({ risiko: 'kein' })).toEqual([]);
		expect(kinds({ risiko: 'risiko', gemeldet_am: '2026-10-25T09:00:00.000Z' })).toEqual([]);
		expect(kinds({ risiko: 'risiko' }, 'nicht_meldepflichtig')).toEqual([]);
	});

	it('adds the communication to data subjects for a high risk unless done or excepted', () => {
		expect(kinds({ risiko: 'hoch' })).toEqual(['meldung-aufsicht', 'benachrichtigung']);
		expect(kinds({ risiko: 'hoch', ausnahme: 'unzugaenglich' })).toEqual(['meldung-aufsicht']);
		expect(kinds({ risiko: 'hoch', benachrichtigt_am: '2026-10-25T09:00:00.000Z' })).toEqual([
			'meldung-aufsicht'
		]);
	});

	it('has no deadline without the time of awareness', () => {
		expect(engine.deadlines!({ state: 'erfasst', data: {} })).toEqual([]);
	});
});

describe('Datenpanne: assessment', () => {
	it('assumes a duty while the risk is open', () => {
		expect(assess({})).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
	});

	it('requires only documentation for "no risk"', () => {
		const result = assess({ risiko: 'kein' });
		expect(result).toMatchObject({ verdict: 'negative', outcome: 'keine-meldung' });
		expect(result.explanation.de).toContain('Art. 33 Abs. 5');
	});

	it('requires notification for a risk and adds the communication for a high risk', () => {
		expect(assess({ risiko: 'risiko' }).outcome).toBe('meldung');
		expect(notes({ risiko: 'risiko' })).toContain('Art. 33 Abs. 3');
		expect(assess({ risiko: 'hoch' }).outcome).toBe('meldung-benachrichtigung');
		expect(notes({ risiko: 'hoch' })).toContain('Art. 34 Abs. 2');
		expect(notes({ risiko: 'hoch', verschluesselt: 'true' })).toContain('Art. 34 Abs. 3 lit. a');
		expect(notes({ risiko: 'hoch', ausnahme: 'aufwand' })).toContain('Art. 34 Abs. 4');
	});

	it('asks for reasons when the notification came after 72 hours', () => {
		const late = { risiko: 'risiko', gemeldet_am: '2026-10-27T09:00:00.000Z' };
		expect(notes(late)).toContain('Art. 33 Abs. 1 Satz 2');
		expect(notes({ ...late, verzoegerung: 'Forensik am Wochenende' })).not.toContain('Satz 2');
		expect(notes({ risiko: 'risiko', gemeldet_am: '2026-10-27T07:59:00.000Z' })).not.toContain(
			'Satz 2'
		);
	});

	it('notes the processor duty and high-risk data categories', () => {
		expect(notes({ risiko: 'risiko', auftragsverarbeiter: 'true' })).toContain('Art. 33 Abs. 2');
		expect(notes({ risiko: 'risiko', datenkategorien: ['zugang'] })).toContain('hohes Risiko');
	});
});

describe('Datenpanne: workflow', () => {
	const options = (data: RecordData, state: string) =>
		allowedTransitions(definition, view(data, state)).map((o) => ({
			to: o.transition.to,
			ok: o.missing.length === 0 && o.blocked === null
		}));

	it('needs a risk and reasons to finish the assessment', () => {
		expect(applyTransition(definition, view({}), 'bewertet')).toMatchObject({
			error: 'missing',
			missing: ['risiko', 'begruendung']
		});
	});

	it('offers "notified" or "not notifiable" depending on the risk', () => {
		expect(options({ risiko: 'kein' }, 'bewertet')).toEqual([
			{ to: 'erfasst', ok: true },
			{ to: 'gemeldet', ok: false },
			{ to: 'nicht_meldepflichtig', ok: true }
		]);
		expect(
			options({ risiko: 'risiko', gemeldet_am: '2026-10-25T09:00:00.000Z' }, 'bewertet')
		).toEqual([
			{ to: 'erfasst', ok: true },
			{ to: 'gemeldet', ok: true },
			{ to: 'nicht_meldepflichtig', ok: false }
		]);
	});

	it('closes a high-risk breach only after communication or an exception', () => {
		const base = { risiko: 'hoch', massnahmen: 'Passwörter zurückgesetzt' };
		expect(applyTransition(definition, view(base, 'gemeldet'), 'abgeschlossen')).toMatchObject({
			error: 'blocked'
		});
		expect(
			applyTransition(
				definition,
				view({ ...base, ausnahme: 'nachtraeglich' }, 'gemeldet'),
				'abgeschlossen'
			)
		).toEqual({ ok: true, state: 'abgeschlossen' });
	});
});
