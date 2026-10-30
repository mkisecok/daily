import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** every .ts and .svelte file under src, generated Paraglide output aside */
function sources(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === 'paraglide' ? [] : sources(path);
		return /\.(ts|svelte)$/.test(entry.name) ? [path] : [];
	});
}

describe('browser support', () => {
	// Safari before 16.4 cannot parse a lookbehind; the whole module fails to
	// load and SvelteKit shows a 500 for the page
	it('uses no regex lookbehind', () => {
		const offenders = sources('src')
			.filter((path) => !path.endsWith('browser-support.spec.ts'))
			.filter((path) => /\(\?<[=!]/.test(readFileSync(path, 'utf8')));
		expect(offenders).toEqual([]);
	});
});
