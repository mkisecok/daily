import { describe, expect, it } from 'vitest';
import { testDefinition as def } from '../fixtures.js';
import { validateRecord } from '../validate.js';
import { formFields, fromInputs, toInputs } from './inputs.js';

describe('form inputs', () => {
	it('leaves assessment fields out of the form', () => {
		expect(formFields(def).map((f) => f.id)).not.toContain('check');
	});

	it('round-trips stored values through the inputs', () => {
		const data = {
			name: 'Eins',
			tags: ['x', 'z'],
			seen: '2026-10-25T09:30:00.000Z',
			count: 3,
			flag: false,
			due: '2026-10-30'
		};
		const values = toInputs(def, data);
		expect(values).toMatchObject({
			seen: '2026-10-25T10:30',
			flag: 'false',
			tags: ['x', 'z'],
			notes: '',
			count: 3
		});
		const { data: stored, errors } = validateRecord(def, fromInputs(def, values));
		expect(errors).toEqual({});
		expect(stored).toMatchObject(data);
		expect(stored.notes).toBeNull();
	});
});
