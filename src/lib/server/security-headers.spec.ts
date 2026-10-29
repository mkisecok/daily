import { describe, expect, it } from 'vitest';
import { allowFormTarget, applySecurityHeaders, SECURITY_HEADERS } from './security-headers.js';

describe('security headers', () => {
	it('adds the identity provider to form-action once', () => {
		const policy = "default-src 'self'; form-action 'self'; frame-ancestors 'none'";
		const allowed = allowFormTarget(policy, 'https://auth.dai-ly.de');
		expect(allowed).toBe(
			"default-src 'self'; form-action 'self' https://auth.dai-ly.de; frame-ancestors 'none'"
		);
		expect(allowFormTarget(allowed, 'https://auth.dai-ly.de')).toBe(allowed);
	});

	it('leaves policies without form-action or without an origin alone', () => {
		expect(allowFormTarget("default-src 'self'", 'https://auth.dai-ly.de')).toBe(
			"default-src 'self'"
		);
		expect(allowFormTarget("form-action 'self'", '')).toBe("form-action 'self'");
	});

	it('sets every header but keeps what a route set itself', () => {
		const headers = new Headers({
			'x-frame-options': 'SAMEORIGIN',
			'content-security-policy': "form-action 'self'"
		});
		applySecurityHeaders(headers, 'http://localhost:8080');
		expect(headers.get('x-frame-options')).toBe('SAMEORIGIN');
		expect(headers.get('x-content-type-options')).toBe('nosniff');
		expect(headers.get('referrer-policy')).toBe(SECURITY_HEADERS['referrer-policy']);
		expect(headers.get('content-security-policy')).toBe("form-action 'self' http://localhost:8080");
	});
});
