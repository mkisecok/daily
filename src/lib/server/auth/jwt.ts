/**
 * Reads a JWT payload without verifying the signature. Only call this on
 * tokens received directly from the token endpoint over a trusted channel.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
	const parts = token.split('.');
	if (parts.length !== 3) return undefined;
	try {
		const json = Buffer.from(parts[1], 'base64url').toString('utf8');
		const parsed: unknown = JSON.parse(json);
		return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
	} catch {
		return undefined;
	}
}

/** Keycloak realm roles live in the access token under `realm_access.roles`. */
export function readRealmRoles(accessToken: string): string[] {
	const payload = decodeJwtPayload(accessToken);
	const realmAccess = payload?.realm_access;
	if (realmAccess && typeof realmAccess === 'object' && 'roles' in realmAccess) {
		const roles = (realmAccess as { roles?: unknown }).roles;
		if (Array.isArray(roles)) {
			return roles.filter((role): role is string => typeof role === 'string');
		}
	}
	return [];
}
