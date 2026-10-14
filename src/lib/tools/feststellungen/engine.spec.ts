import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { applyTransition } from '../../records/workflow.js';
import { definition, engine } from './engine.js';

function view(data: RecordData, state = 'offen') {
	return { state, data: validateRecord(definition, data).data };
}
const finding: RecordData = {
	titel: 'Kein Wiederherstellungstest',
	audit: 'audit-1',
	kategorie: 'wesentlich',
	anforderung: 'Art. 32 Abs. 1 lit. c DSGVO',
	sachverhalt: 'Seit zwei Jahren kein Test',
	nachweis: 'Interview IT-Leitung',
	ursache: 'Keine Zuständigkeit festgelegt',
	massnahme: 'Halbjährlicher Test mit Protokoll',
	verantwortlich: 'IT-Leitung',
	frist: '2026-12-15'
};
const assess = (data: RecordData, state?: string) => engine.assess!(view(data, state))!;

describe('Feststellungen', () => {
	it('grades open findings by category', () => {
		expect(assess(finding)).toMatchObject({ verdict: 'positive', outcome: 'wesentlich' });
		expect(assess({ ...finding, kategorie: 'gering' }).verdict).toBe('conditional');
		expect(assess({ ...finding, kategorie: 'hinweis' }).verdict).toBe('negative');
		expect(assess(finding, 'wirksam').outcome).toBe('wirksam');
	});

	it('asks for evidence, cause, deadline and the audit link', () => {
		const notes = assess({ titel: 'X', kategorie: 'gering', sachverhalt: 's' })
			.notes!.map((n) => n.de)
			.join('\n');
		expect(notes).toContain('objektiven Nachweis');
		expect(notes).toContain('Ursache');
		expect(notes).toContain('Frist');
		expect(notes).toContain('Auditbericht');
	});

	it('sets an action only after the cause and never closes a nonconformity without one', () => {
		expect(
			applyTransition(definition, view({ ...finding, ursache: '' }), 'massnahme')
		).toMatchObject({ error: 'blocked' });
		expect(applyTransition(definition, view(finding), 'massnahme')).toEqual({
			ok: true,
			state: 'massnahme'
		});
		expect(applyTransition(definition, view(finding), 'geschlossen')).toMatchObject({
			error: 'blocked'
		});
		expect(
			applyTransition(definition, view({ ...finding, kategorie: 'positiv' }), 'geschlossen')
		).toEqual({ ok: true, state: 'geschlossen' });
	});

	it('tracks the action deadline, then the effectiveness check', () => {
		expect(engine.deadlines!(view(finding, 'massnahme')).map((d) => [d.kind, d.dueAt])).toEqual([
			['massnahme', '2026-12-15T08:00:00.000Z']
		]);
		expect(
			engine.deadlines!(view({ ...finding, pruefen_am: '2027-06-15' }, 'umgesetzt')).map(
				(d) => d.kind
			)
		).toEqual(['wirksamkeit']);
	});
});
