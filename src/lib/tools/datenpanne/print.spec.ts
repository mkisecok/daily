import { describe, expect, it } from 'vitest';
import { noticeParts } from './print.js';

const rows = (data: Record<string, unknown>) =>
	noticeParts(data as never, 'erfasst', 'de').flatMap((part) => part.rows);
const answer = (data: Record<string, unknown>, label: string) =>
	rows(data).find((row) => row.label === label)?.value;

describe('breach notification on paper', () => {
	it('works out the end of the 72 hours and whether the notice made it', () => {
		const aware = { kenntnis: '2026-11-10T08:00:00.000Z' };
		expect(answer(aware, '72 Stunden enden')).toBe('13.11.2026 09:00');
		expect(answer(aware, 'Innerhalb von 72 Stunden')).toBe('Noch nicht gemeldet');
		expect(
			answer({ ...aware, gemeldet_am: '2026-11-12T10:00:00.000Z' }, 'Innerhalb von 72 Stunden')
		).toBe('Ja');
		const late = { ...aware, gemeldet_am: '2026-11-14T10:00:00.000Z', verzoegerung: 'Wochenende' };
		expect(answer(late, 'Innerhalb von 72 Stunden')).toBe('Nein');
		expect(answer(late, 'Gründe für die Verzögerung')).toBe('Wochenende');
	});

	it('follows the letters of Art. 33(3) and leaves a line for the DPO', () => {
		const letters = noticeParts({} as never, 'erfasst', 'de')
			.find((part) => part.id === 'angaben')!
			.rows.map((row) => row.letter);
		expect(letters).toEqual(['a', 'a', 'a', 'b', 'c', 'c', 'd']);
		expect(rows({}).find((row) => row.letter === 'b')?.fill).toBe(true);
	});
});
