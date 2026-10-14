import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4174,
		timeout: 180_000,
		// Keycloak sends the browser back to this origin after sign-in.
		env: { APP_ORIGIN: 'http://localhost:4174' }
	},
	testMatch: '**/*.e2e.{ts,js}',
	testIgnore: '**/*.preview.e2e.{ts,js}'
});
