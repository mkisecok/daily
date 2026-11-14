import { describe, expect, it } from 'vitest';
import { allFields, validateRecord } from '../records/validate.js';
import { listRecordTools } from './registry.js';

const withExample = listRecordTools().filter((tool) => tool.definition.example);

describe('tool examples', () => {
	it('exist for the tools used every week', () => {
		expect(withExample.map((tool) => tool.definition.slug)).toEqual(
			expect.arrayContaining([
				'betroffenenanfrage',
				'datenpanne',
				'avv-pruefung',
				'ki-register',
				'schulungsnachweis',
				'feststellungen',
				'loeschkonzept',
				'tom-katalog',
				'auditprogramm',
				'dsfa',
				'vorgang',
				'beratungsvermerk'
			])
		);
	});

	it('exist for the register of processing and the occasion tools', () => {
		expect(withExample.map((tool) => tool.definition.slug)).toEqual(
			expect.arrayContaining([
				'vvt',
				'software-einfuehrung',
				'ki-einfuehrung',
				'personalwechsel',
				'videoueberwachung',
				'website-start'
			])
		);
	});

	it.each(withExample.map((tool) => [tool.definition.slug, tool.definition] as const))(
		'%s: names real fields only and passes validation',
		(_, definition) => {
			const example = definition.example!;
			const ids = new Set(allFields(definition).map((field) => field.id));
			expect(Object.keys(example).filter((id) => !ids.has(id))).toEqual([]);
			const { data, errors } = validateRecord(definition, example);
			expect(errors).toEqual({});
			for (const [id, value] of Object.entries(example)) expect(data[id]).toEqual(value);
		}
	);
});
