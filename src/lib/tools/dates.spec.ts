import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DATES, since, type DateKey } from './risikoklassifizierung/engine.js';

const KEYS = Object.keys(DATES).filter((key) => key !== 'source') as DateKey[];

/** every tool source a user reads: engines, definitions, catalogs */
function sources(dir = 'src/lib/tools'): { file: string; text: string }[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sources(path);
		if (!/\.(ts|json)$/.test(entry.name) || entry.name.endsWith('.spec.ts')) return [];
		return [{ file: path, text: readFileSync(path, 'utf8') }];
	});
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('AI Act dates', () => {
	afterEach(() => vi.useRealTimers());

	it('read "ab dem" before the day and "seit dem" from midnight in Berlin', () => {
		const before = new Date('2027-12-01T22:59:59Z');
		const on = new Date('2027-12-01T23:00:00Z');
		expect(since('annexIII', before)).toEqual({
			de: 'ab dem 2. Dezember 2027',
			en: 'from 2 December 2027'
		});
		expect(since('annexIII', on)).toEqual({
			de: 'seit dem 2. Dezember 2027',
			en: 'since 2 December 2027'
		});
	});

	it('are never written as "ab dem" or "from" by hand', () => {
		const found = sources().flatMap(({ file, text }) =>
			KEYS.flatMap((key) => {
				const date = DATES[key];
				const pattern = new RegExp(
					`(ab dem|from) (${escape(date.de)}|${escape(date.en)}|\\$\\{[A-Z_]+\\.${key}\\.(de|en)\\})`,
					'g'
				);
				return [...text.matchAll(pattern)].map((match) => `${file}: ${match[0]}`);
			})
		);
		expect(found).toEqual([]);
	});

	it('are not written as "seit dem" or "since" before the day has come', () => {
		const now = new Date();
		const future = KEYS.filter((key) => since(key, now).en.startsWith('from'));
		const found = sources().flatMap(({ file, text }) =>
			future.flatMap((key) => {
				const date = DATES[key];
				const pattern = new RegExp(`(seit dem|since) (${escape(date.de)}|${escape(date.en)})`, 'g');
				return [...text.matchAll(pattern)].map((match) => `${file}: ${match[0]}`);
			})
		);
		expect(found).toEqual([]);
	});
});
