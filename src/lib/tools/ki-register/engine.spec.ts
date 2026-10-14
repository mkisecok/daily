import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { validateRecord } from '../../records/validate.js';
import type { QuestionnaireResult } from '../types.js';
import { definition, engine } from './engine.js';

function view(data: RecordData) {
	return { state: null, data: validateRecord(definition, data).data };
}

const notes = (data: RecordData) =>
	engine.assess!(view(data))!
		.notes!.map((n) => n.de)
		.join('\n');

describe('KI-Register', () => {
	it('requires name, purpose, role and status', () => {
		const { errors } = validateRecord(definition, {});
		expect(errors).toEqual({
			name: 'required',
			zweck: 'required',
			rolle: 'required',
			status: 'required'
		});
	});

	it('takes the risk class over from the risk classification', () => {
		const result = (outcome: string) =>
			({ outcome, verdict: 'positive', headline: { de: '', en: '' } }) as QuestionnaireResult;
		expect(engine.fromAssessment!('einstufung', result('hochrisiko'))).toEqual({
			risikoklasse: 'hochriskant'
		});
		expect(engine.fromAssessment!('einstufung', result('kein-ki'))).toEqual({
			risikoklasse: 'ausserhalb'
		});
		expect(engine.fromAssessment!('einstufung', result('unbekannt'))).toEqual({});
		expect(engine.fromAssessment!('anderes', result('minimal'))).toEqual({});
	});

	it('sets the review date at 9:00 German time and drops it for retired systems', () => {
		expect(engine.deadlines!(view({ wiedervorlage: '2026-11-02', status: 'aktiv' }))).toEqual([
			expect.objectContaining({ kind: 'wiedervorlage', dueAt: '2026-11-02T08:00:00.000Z' })
		]);
		expect(
			engine.deadlines!(view({ wiedervorlage: '2026-11-02', status: 'ausser_betrieb' }))
		).toEqual([]);
		expect(engine.deadlines!(view({ status: 'aktiv' }))).toEqual([]);
	});

	it('treats a missing risk class as unclear and asks for the classification', () => {
		const result = engine.assess!(view({}))!;
		expect(result.outcome).toBe('ungeklaert');
		expect(result.verdict).toBe('conditional');
		expect(notes({})).toContain('nicht mit einer Risikoklassifizierung belegt');
	});

	it('lists deployer and provider duties for high-risk systems by role', () => {
		const deployer = notes({ risikoklasse: 'hochriskant', rolle: 'betreiber' });
		expect(deployer).toContain('Art. 26');
		expect(deployer).not.toContain('Art. 43');
		const both = notes({ risikoklasse: 'hochriskant', rolle: 'beides' });
		expect(both).toContain('Art. 26');
		expect(both).toContain('Art. 43');
	});

	it('adds data protection notes from the data section', () => {
		const text = notes({
			risikoklasse: 'minimal',
			personenbezug: 'true',
			datenkategorien: ['beschaeftigte', 'biometrie'],
			gpai: 'true'
		});
		expect(text).toContain('DSFA');
		expect(text).toContain('Art. 9 Abs. 2');
		expect(text).toContain('§ 87 Abs. 1 Nr. 6 BetrVG');
		expect(text).toContain('Art. 53');
	});

	it('names no AI Act duties for systems outside the scope', () => {
		const result = engine.assess!(view({ risikoklasse: 'ausserhalb' }))!;
		expect(result.verdict).toBe('negative');
		expect(result.notes).toEqual([]);
	});
});
