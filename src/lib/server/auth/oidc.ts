import * as client from 'openid-client';
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_ISSUER } from '$app/env/private';

let configuration: Promise<client.Configuration> | undefined;

/**
 * discovered OIDC configuration for the Keycloak realm, cached for the
 * process lifetime. Plain http is only accepted for a localhost issuer.
 */
export function getOidcConfiguration(): Promise<client.Configuration> {
	if (!configuration) {
		const issuer = new URL(KEYCLOAK_ISSUER);
		const insecure = issuer.protocol === 'http:' && isLocalHost(issuer.hostname);
		configuration = client
			.discovery(issuer, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, undefined, {
				execute: insecure ? [client.allowInsecureRequests] : []
			})
			.catch((error: unknown) => {
				configuration = undefined;
				throw error;
			});
	}
	return configuration;
}

function isLocalHost(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
