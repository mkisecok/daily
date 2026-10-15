import { defineConfig } from '@playwright/test';

/**
 * the public GitHub Pages preview: static build under /daily, no server,
 * records in browser storage. `pnpm test:e2e:preview`.
 */
export default defineConfig({
	webServer: {
		command: 'pnpm run build:static && pnpm run preview:static',
		url: 'http://localhost:4175/daily/',
		timeout: 300_000,
		env: { PUBLIC_BASE_PATH: '/daily' }
	},
	use: { baseURL: 'http://localhost:4175/daily/' },
	testMatch: '**/*.preview.e2e.{ts,js}'
});
