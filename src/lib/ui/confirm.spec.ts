import { describe, expect, it } from 'vitest';
import { confirmMatches } from './confirm.js';

describe('typed confirmation', () => {
	it('confirms without a word and ignores case and outer spaces', () => {
		expect(confirmMatches('', undefined)).toBe(true);
		expect(confirmMatches(' Archivieren ', 'archivieren')).toBe(true);
		expect(confirmMatches('ARCHIVIEREN', 'archivieren')).toBe(true);
		expect(confirmMatches('LÖSCHEN', 'löschen')).toBe(true);
	});

	it('rejects other or empty input', () => {
		expect(confirmMatches('archiv', 'archivieren')).toBe(false);
		expect(confirmMatches('', 'archivieren')).toBe(false);
		expect(confirmMatches('   ', 'löschen')).toBe(false);
		expect(confirmMatches('', '  ')).toBe(false);
	});
});
