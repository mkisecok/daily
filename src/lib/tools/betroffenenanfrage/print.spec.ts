import { describe, expect, it } from 'vitest';
import { accessParts, accessReady } from './print.js';

describe('access reply on paper', () => {
	it('prints only for an access request whose first stage is answered', () => {
		expect(accessReady({ rechte: ['auskunft'] })).toBe(false);
		expect(accessReady({ rechte: ['loeschung'], a_verarbeitet: 'ja' })).toBe(false);
		expect(accessReady({ rechte: ['auskunft'], a_verarbeitet: 'ja' })).toBe(true);
	});

	it('ends a negative reply after the first stage', () => {
		const parts = accessParts({ a_verarbeitet: 'nein' }, 'de');
		expect(parts.map((p) => p.id)).toEqual(['antrag']);
	});

	it('lists lit. a to h with the fixed rights and defaults for origin and transfers', () => {
		const parts = accessParts({ a_verarbeitet: 'ja', a_zwecke: 'Vertrag' }, 'de');
		const rows = parts.find((p) => p.id === 'angaben')!.rows;
		expect(rows.map((r) => r.letter)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '']);
		expect(rows[4].value).toContain('Berichtigung');
		expect(rows[6].value).toBe('Bei Ihnen selbst erhoben.');
		expect(rows[8].value).toBe('Keine Übermittlung.');
	});
});
