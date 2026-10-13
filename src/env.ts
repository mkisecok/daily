import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Postgres connection string for the daily database.' },
	KEYCLOAK_ISSUER: {
		description: 'OIDC issuer URL of the Keycloak realm, e.g. https://auth.dai-ly.de/realms/daily'
	},
	KEYCLOAK_CLIENT_ID: { description: 'Keycloak client id of the web app.' },
	KEYCLOAK_CLIENT_SECRET: { description: 'Keycloak client secret of the web app.' },
	APP_ORIGIN: {
		description: 'Public origin of this app, used for OIDC redirect URIs.',
		schema: (value) => {
			if (!value || !/^https?:\/\//.test(value)) throw new Error('APP_ORIGIN must be an origin');
			return value.replace(/\/$/, '');
		}
	}
});
