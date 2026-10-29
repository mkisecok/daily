import { describe, expect, it } from 'vitest';
import { referenceFields } from '../../records/links.js';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import { definition, engine } from './engine.js';

const assess = (data: RecordData) =>
	engine.assess!({ state: null, data: validateRecord(definition, data).data })!;

describe('Auditbericht', () => {
	it('composes the referenced audit', () => {
		expect(definition.composes).toEqual(['audit']);
		expect(referenceFields(definition).map((f) => [f.id, f.tool])).toEqual([
			['audit', 'auditprogramm']
		]);
		expect(validateRecord(definition, {}).errors).toMatchObject({
			audit: 'required',
			zusammenfassung: 'required'
		});
	});

	it('is a draft until approved and asks for conclusion, recommendations and distribution', () => {
		const draft = assess({ titel: 'Bericht', audit: 'a1', zusammenfassung: 's' });
		expect(draft.outcome).toBe('entwurf');
		const notes = draft.notes!.map((n) => n.de).join('\n');
		expect(notes).toContain('Gesamturteil');
		expect(notes).toContain('Empfehlungen');
		expect(notes).toContain('Verteiler');
		const approved = assess({
			titel: 'Bericht',
			audit: 'a1',
			zusammenfassung: 's',
			gesamturteil: 'nicht_konform',
			freigegeben_am: '2026-12-01'
		});
		expect(approved).toMatchObject({ outcome: 'freigegeben', verdict: 'positive' });
	});

	it('needs no recommendations for a conforming audit', () => {
		const result = assess({
			titel: 'Bericht',
			audit: 'a1',
			zusammenfassung: 's',
			gesamturteil: 'konform',
			verteiler: 'Geschäftsführung',
			freigegeben_am: '2026-12-01'
		});
		expect(result).toMatchObject({ outcome: 'freigegeben', verdict: 'negative' });
		expect(result.notes).toEqual([]);
	});

	it('asks for recommendations when there are nonconformities', () => {
		const result = assess({
			titel: 'Bericht',
			audit: 'a1',
			zusammenfassung: 's',
			gesamturteil: 'abweichungen',
			verteiler: 'Geschäftsführung'
		});
		expect(result.outcome).toBe('entwurf');
		expect(result.notes!.map((n) => n.de)).toEqual([
			'Empfehlungen für die Behebung der Abweichungen ergänzen.'
		]);
		const withAdvice = assess({
			titel: 'Bericht',
			audit: 'a1',
			zusammenfassung: 's',
			gesamturteil: 'abweichungen',
			empfehlungen: 'Schulung',
			verteiler: 'Geschäftsführung',
			freigegeben_am: '2026-12-01'
		});
		expect(withAdvice).toMatchObject({ verdict: 'negative', notes: [] });
	});
});
