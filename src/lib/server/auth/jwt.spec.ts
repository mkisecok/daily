import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, readRealmRoles } from './jwt.js';

function fakeJwt(payload: unknown): string {
	const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
	return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('decodeJwtPayload', () => {
	it('returns the payload of a well-formed token', () => {
		expect(decodeJwtPayload(fakeJwt({ sub: 'abc', exp: 1 }))).toEqual({ sub: 'abc', exp: 1 });
	});

	it('returns undefined for malformed input', () => {
		expect(decodeJwtPayload('not-a-jwt')).toBeUndefined();
		expect(decodeJwtPayload('a.b')).toBeUndefined();
		expect(decodeJwtPayload('a.!!!.c')).toBeUndefined();
	});
});

describe('readRealmRoles', () => {
	it('extracts realm roles from a Keycloak access token', () => {
		const token = fakeJwt({ realm_access: { roles: ['user', 'editor', 42] } });
		expect(readRealmRoles(token)).toEqual(['user', 'editor']);
	});

	it('returns an empty list when the claim is absent or malformed', () => {
		expect(readRealmRoles(fakeJwt({}))).toEqual([]);
		expect(readRealmRoles(fakeJwt({ realm_access: 'nope' }))).toEqual([]);
		expect(readRealmRoles('garbage')).toEqual([]);
	});
});
