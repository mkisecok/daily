import { describe, expect, it } from 'vitest';
import { nextNumber } from './numbering.js';
import type { StoredRecord } from './types.js';

const record = (nummer: string) => ({ data: { nummer } }) as unknown as StoredRecord;
const now = new Date('2026-11-13T09:00:00Z');

describe('running numbers', () => {
	it('starts each month at 001', () => {
		expect(nextNumber([], 'nummer', now)).toBe('2026-11-001');
		expect(nextNumber([record('2026-10-009')], 'nummer', now)).toBe('2026-11-001');
	});

	it('continues after the highest number of the month, gaps and own texts aside', () => {
		const records = [record('2026-11-002'), record('2026-11-007'), record('Altfall 3')];
		expect(nextNumber(records, 'nummer', now)).toBe('2026-11-008');
	});
});
