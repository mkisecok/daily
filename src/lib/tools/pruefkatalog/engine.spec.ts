import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine, TEMPLATES } from './engine.js';

const assess = (data: RecordData) =>
	engine.assess!({ state: null, data: validateRecord(definition, data).data })!;

describe('Prüfkatalog', () => {
	it('offers question sets for each topic', () => {
		expect(Object.keys(TEMPLATES)).toEqual([
			'dsgvo',
			'tom',
			'betroffenenrechte',
			'auftragsverarbeitung',
			'datenpannen',
			'kivo',
			'isms',
			'aims'
		]);
		expect(Object.values(TEMPLATES).every((t) => t.questions.length >= 4)).toBe(true);
	});

	it('lists the template questions as the checklist', () => {
		const result = assess({ titel: 'TOM', vorlage: 'tom' });
		expect(result.notesTitle?.de).toBe('Prüffragen der Vorlage');
		expect(result.notes).toEqual(TEMPLATES.tom.questions);
		expect(result.outcome).toBe('offen');
	});

	it('grades the result and asks for evidence', () => {
		expect(assess({ titel: 'X', ergebnis: 'nicht_erfuellt' })).toMatchObject({
			verdict: 'positive',
			outcome: 'nicht-erfuellt'
		});
		expect(assess({ titel: 'X', ergebnis: 'teilweise' }).verdict).toBe('conditional');
		expect(assess({ titel: 'X', ergebnis: 'erfuellt' }).headline.de).toBe(
			'Erfüllt, aber ohne Nachweis.'
		);
		expect(assess({ titel: 'X', ergebnis: 'erfuellt', stichproben: '5 Akten' }).verdict).toBe(
			'negative'
		);
	});

	it('accepts written evidence in place of samples', () => {
		expect(assess({ titel: 'X', ergebnis: 'erfuellt', nachweise: 'Richtlinie v3' })).toMatchObject({
			verdict: 'negative',
			outcome: 'erfuellt'
		});
	});

	it('asks for a template or own questions while nothing is chosen', () => {
		const result = assess({ titel: 'X' });
		expect(result).toMatchObject({ verdict: 'conditional', outcome: 'offen' });
		expect(result.notes).toEqual([]);
		expect(result.explanation.de).toContain('Vorlage wählen');
	});

	it('keeps the template questions whatever the result, and cites ISO 27001 9.2', () => {
		const result = assess({ titel: 'X', vorlage: 'dsgvo', ergebnis: 'nicht_erfuellt' });
		expect(result.notes).toEqual(TEMPLATES.dsgvo.questions);
		expect(result.citations).toEqual([{ law: 'ISO 27001', ref: 'Kap. 9.2' }]);
	});
});
