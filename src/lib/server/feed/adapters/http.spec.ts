import { describe as group, expect, it } from 'vitest';
import { describe } from './http.js';

group('describe', () => {
	it('names the network cause behind "fetch failed"', () => {
		const error = new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
		expect(describe(error)).toBe('fetch failed (ECONNRESET)');
	});

	it('reports aborts as timeouts', () => {
		const error = new Error('aborted');
		error.name = 'AbortError';
		expect(describe(error)).toBe('timeout');
	});

	it('keeps HTTP errors as they are', () => {
		expect(describe(new Error('HTTP 503 Service Unavailable'))).toBe(
			'HTTP 503 Service Unavailable'
		);
	});
});
