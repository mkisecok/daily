/**
 * response headers every page and endpoint of the Node build sends. HSTS is
 * set by Caddy, which terminates TLS; the Content-Security-Policy comes from
 * SvelteKit (`csp` in vite.config.ts) and gets the sign-in origin here.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'cross-origin-opener-policy': 'same-origin',
	'x-frame-options': 'DENY'
};

/**
 * adds the identity provider to `form-action`: the logout form redirects to
 * Keycloak, and browsers apply form-action to that redirect. The origin is
 * known only at runtime, so it cannot be part of the build-time policy.
 */
export function allowFormTarget(policy: string, origin: string): string {
	if (!origin || !/(^|;)\s*form-action\s/.test(policy)) return policy;
	return policy.replace(/(^|;)(\s*form-action\s[^;]*)/, (_match, start, directive) =>
		directive.split(/\s+/).includes(origin)
			? `${start}${directive}`
			: `${start}${directive} ${origin}`
	);
}

/** sets the security headers on a response, leaving headers a route chose itself */
export function applySecurityHeaders(headers: Headers, identityOrigin: string): void {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(name)) headers.set(name, value);
	}
	const policy = headers.get('content-security-policy');
	if (policy) headers.set('content-security-policy', allowFormTarget(policy, identityOrigin));
}
