import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * CSP hashes of the inline scripts in src/app.html (the theme script). A
 * nonce placeholder would block prerendering, and the hash follows the
 * script whenever it changes.
 */
function templateScriptHashes(): `sha256-${string}`[] {
	const template = readFileSync('src/app.html', 'utf8');
	return [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
		([, body]) => `sha256-${createHash('sha256').update(body).digest('base64')}` as const
	);
}

export default defineConfig(({ mode }) => {
	// `pnpm build:static` runs with --mode static and reads .env.static
	const env = loadEnv(mode, process.cwd(), '');
	const preview = env.PUBLIC_PREVIEW === '1' || env.PUBLIC_PREVIEW === 'true';
	const base = (env.PUBLIC_BASE_PATH ?? '').replace(/\/$/, '') as '' | `/${string}`;
	if (base && !base.startsWith('/')) throw new Error('PUBLIC_BASE_PATH must start with /');

	// Paraglide must see the base path to tell /daily/en/… from /daily/…
	const origin = ':protocol://:domain(.*)::port?' + base;
	const urlPatterns = base
		? [
				{
					pattern: `${origin}/:path(.*)?`,
					localized: [
						['en', `${origin}/en/:path(.*)?`],
						['de', `${origin}/:path(.*)?`]
					] as [string, string][]
				}
			]
		: undefined;

	return {
		plugins: [
			sveltekit({
				compilerOptions: {
					// force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: preview
					? // GitHub Pages: 404.html is served for unknown paths; auth endpoints stay unbuilt.
						adapterStatic({ fallback: '404.html', strict: false })
					: adapterNode(),
				paths: { base, relative: false },
				// the Node build only: GitHub Pages cannot send headers, and the preview has no
				// server. The Keycloak origin joins form-action at runtime (src/hooks.server.ts).
				csp: preview
					? undefined
					: {
							mode: 'auto',
							directives: {
								'default-src': ['self'],
								'script-src': ['self', ...templateScriptHashes()],
								// Bits UI positions popovers with style attributes
								'style-src': ['self', 'unsafe-inline'],
								'img-src': ['self', 'data:', 'blob:'],
								// Vite inlines small font subsets as data: URLs
								'font-src': ['self', 'data:'],
								// the Guardrail-Test calls endpoints the user enters
								'connect-src': ['self', 'https:'],
								// the pdf.js worker of the Anonymisierer
								'worker-src': ['self', 'blob:'],
								'form-action': ['self'],
								'frame-ancestors': ['none'],
								'base-uri': ['self'],
								'object-src': ['none']
							}
						}
			}),

			paraglideVitePlugin({
				project: './project.inlang',
				outdir: './src/lib/paraglide',
				emitTsDeclarations: true,
				// German lives at /, English at /en/…; the URL wins over the cookie
				strategy: ['url', 'cookie', 'baseLocale'],
				urlPatterns,
				trailingSlash: preview ? 'always' : undefined
			})
		],
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						browser: {
							enabled: true,
							provider: playwright(),
							instances: [{ browser: 'chromium', headless: true }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**']
					}
				},

				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
