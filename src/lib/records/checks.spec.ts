import { describe, expect, it } from 'vitest';
import { checkFields, checkStatus, formatCheck, gapDeadlines, settled } from './checks.js';
import type { RecordToolDefinition } from './types.js';
import { toInput } from './ui/inputs.js';
import { validateRecord } from './validate.js';

const L = (de: string, en: string) => ({ de, en });
const definition: RecordToolDefinition = {
	slug: 'test-checklist',
	version: 1,
	intro: L('', ''),
	sources: [],
	titleField: 'name',
	sections: [
		{
			id: 'main',
			title: L('Punkte', 'Points'),
			fields: [
				{ id: 'name', type: 'text', label: L('Name', 'Name') },
				...checkFields({
					id: 'backup',
					label: L('Sicherung', 'Backup'),
					cite: { law: 'DSGVO', ref: 'Art. 32' }
				}),
				...checkFields({ id: 'clause', label: L('Klausel', 'Clause'), na: false })
			]
		}
	]
};
const valid = (input: Record<string, unknown>) => validateRecord(definition, input);

describe('checklist points', () => {
	it('come with a note and a due date that belong to them', () => {
		const fields = checkFields({ id: 'p', label: L('Punkt', 'Point') });
		expect(fields.map((f) => [f.id, f.type, f.partOf])).toEqual([
			['p', 'check', undefined],
			['p_notiz', 'text', 'p'],
			['p_frist', 'date', 'p']
		]);
	});

	it('store ja, nein or entfaellt, and read old yes/no answers', () => {
		expect(valid({ backup: 'entfaellt', clause: 'ja' })).toMatchObject({
			data: { backup: 'entfaellt', clause: 'ja' },
			errors: {}
		});
		expect(valid({ backup: true, clause: false }).data).toMatchObject({
			backup: 'ja',
			clause: 'nein'
		});
		expect(valid({ backup: 'true' }).data.backup).toBe('ja');
		// a point that always applies cannot be "not applicable"
		expect(valid({ clause: 'entfaellt' }).errors).toEqual({ clause: 'invalid' });
		expect(valid({ backup: 'vielleicht' }).errors).toEqual({ backup: 'invalid' });
		expect(toInput(definition.sections[0].fields[1], true)).toBe('ja');
	});

	it('count met and not applicable as settled, old answers included', () => {
		expect([true, false, 'ja', 'nein', 'entfaellt', null].map(checkStatus)).toEqual([
			'ja',
			'nein',
			'ja',
			'nein',
			'entfaellt',
			null
		]);
		expect(settled('entfaellt')).toBe(true);
		expect(settled('nein')).toBe(false);
	});

	it('read with their due date and note', () => {
		const data = valid({
			backup: 'nein',
			backup_frist: '2026-12-04',
			backup_notiz: 'Band fehlt'
		}).data;
		const field = definition.sections[0].fields[1];
		expect(formatCheck(field, data, 'de', definition.sections[0].fields)).toBe(
			'Nein · Frist 04.12.2026 · Band fehlt'
		);
	});

	it('turn a "nein" with a due date into a deadline', () => {
		const record = {
			state: null,
			data: valid({
				backup: 'nein',
				backup_frist: '2026-12-04',
				clause: 'ja',
				clause_frist: '2026-12-01'
			}).data
		};
		const specs = gapDeadlines(definition, record);
		expect(specs).toEqual([
			expect.objectContaining({
				kind: 'luecke-backup',
				label: L('Lücke schließen: Sicherung', 'Close the gap: Backup'),
				cite: { law: 'DSGVO', ref: 'Art. 32' }
			})
		]);
		expect(specs[0].dueAt.slice(0, 10)).toBe('2026-12-04');
		expect(gapDeadlines(definition, record, () => false)).toEqual([]);
	});
});
