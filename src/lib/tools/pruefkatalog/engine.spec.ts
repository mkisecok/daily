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
});
