import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { applyTransition } from '../../records/workflow.js';
import { definition, engine, reportingDays } from './engine.js';

/** Friday 23 October 2026, 12:00 in Berlin; daylight saving ends two days later */
const AWARE = '2026-10-23T10:00:00.000Z';

function view(data: RecordData, state = 'erfasst') {
	return {
		state,
		data: validateRecord(definition, {
			kenntnis: AWARE,
			rolle: 'anbieter',
			art: ['gesundheit'],
			kausalitaet: 'festgestellt',
			...data
		}).data
	};
}

const due = (data: RecordData) =>
	Object.fromEntries(engine.deadlines!(view(data)).map((d) => [d.kind, d.dueAt]));
const assess = (data: RecordData) => engine.assess!(view(data))!;
const notes = (data: RecordData) =>
	assess(data)
		.notes!.map((n) => n.de)
		.join('\n');

describe('Vorfallmeldung: periods', () => {
	it('picks 15, 10 or 2 days, the shortest applicable winning', () => {
		expect(reportingDays(view({}))).toBe(15);
		expect(reportingDays(view({ todesfall: 'true' }))).toBe(10);
		expect(reportingDays(view({ todesfall: 'true', weitverbreitet: 'true' }))).toBe(2);
		expect(reportingDays(view({ art: ['infrastruktur'] }))).toBe(2);
	});

	it('counts days in absolute time from awareness', () => {
		expect(due({})).toEqual({ meldung: '2026-11-07T10:00:00.000Z' });
		expect(due({ todesfall: 'true' })).toEqual({ meldung: '2026-11-02T10:00:00.000Z' });
		expect(due({ weitverbreitet: 'true' })).toEqual({ meldung: '2026-10-25T10:00:00.000Z' });
	});

	it('adds the internal target for deployers to inform the provider', () => {
		expect(due({ rolle: 'betreiber' })).toEqual({
			anbieter: '2026-10-24T10:00:00.000Z',
			meldung: '2026-11-07T10:00:00.000Z'
		});
		expect(Object.keys(due({ rolle: 'betreiber', anbieter_informiert_am: AWARE }))).toEqual([
			'meldung'
		]);
	});

	it('runs no clock when nothing reportable occurred or once reported', () => {
		expect(due({ art: [] })).toEqual({});
		expect(due({ kausalitaet: 'ausgeschlossen' })).toEqual({});
		expect(due({ gemeldet_am: '2026-10-30T10:00:00.000Z' })).toEqual({});
		expect(due({ kausalitaet: 'ungeklaert' })).toHaveProperty('meldung');
	});
});

describe('Vorfallmeldung: assessment and workflow', () => {
	it('classifies reportable, possible and non-reportable incidents', () => {
		expect(assess({})).toMatchObject({ verdict: 'positive', outcome: 'meldepflichtig' });
		expect(assess({}).headline.de).toBe('Meldepflichtig: spätestens 15 Tage ab Kenntnis.');
		expect(assess({ kausalitaet: 'ungeklaert' }).outcome).toBe('pruefen');
		expect(assess({ art: [] }).outcome).toBe('kein-meldefall');
	});

	it('explains duties by role and the link to data breaches', () => {
		expect(notes({})).toContain('Art. 73 Abs. 6');
		expect(notes({ rolle: 'betreiber' })).toContain('Art. 26 Abs. 5');
		expect(notes({ datenpanne: 'true' })).toContain('72-Stunden-Frist');
		expect(notes({})).toContain('Art. 73 Abs. 5');
		expect(notes({ erstmeldung: 'true' })).not.toContain('Art. 73 Abs. 5');
	});

	it('documents a non-reportable incident only when nothing reportable remains', () => {
		const reasons = { untersuchung: 'Bedienfehler, System ohne Einfluss' };
		expect(applyTransition(definition, view(reasons), 'kein_meldefall')).toMatchObject({
			error: 'blocked'
		});
		expect(
			applyTransition(
				definition,
				view({ ...reasons, kausalitaet: 'ausgeschlossen' }),
				'kein_meldefall'
			)
		).toEqual({ ok: true, state: 'kein_meldefall' });
	});
});
