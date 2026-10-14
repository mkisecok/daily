import { describe, expect, it } from 'vitest';
import { scan, scannable, summarise, validCard, validIban } from './scan.js';

const ids = (content: string, path = 'src/app.ts') =>
	scan([{ path, content }]).map((f) => f.rule.id);

describe('Repo-Check scanner', () => {
	it('validates IBANs and card numbers by checksum', () => {
		expect(validIban('DE89 3704 0044 0532 0130 00')).toBe(true);
		expect(validIban('DE89 3704 0044 0532 0130 01')).toBe(false);
		expect(validCard('4111 1111 1111 1111')).toBe(true);
		expect(validCard('4111 1111 1111 1112')).toBe(false);
		expect(validCard('0000 0000 0000 0000')).toBe(false);
	});

	it('finds secrets and masks them', () => {
		const findings = scan([
			{
				path: '.env.ts',
				content: 'const key = "AKIAABCDEFGHIJKLMNOP";\nconst password = "s3cret-Passw0rd";'
			}
		]);
		expect(findings.map((f) => f.rule.id)).toEqual(['aws-key', 'assigned-secret']);
		expect(findings[0].excerpt).toBe('const key = "AKIA…••••";');
		expect(findings[1].excerpt).not.toContain('s3cret-Passw0rd');
	});

	it('ignores placeholders and example addresses', () => {
		expect(ids('const password = "changeme123";')).toEqual([]);
		expect(ids('const token = process.env.TOKEN;')).toEqual([]);
		expect(ids('mail: "max@example.com", other: "a@b.test", info@firma.de')).toEqual([]);
		expect(ids('kontakt: "erika.mustermann@firma.de"')).toEqual(['email']);
	});

	it('finds personal data patterns', () => {
		expect(ids('iban = "DE89 3704 0044 0532 0130 00"')).toEqual(['iban']);
		expect(ids('card: 4111111111111111')).toEqual(['card']);
		expect(ids('tel: +49 30 1234567')).toEqual(['phone']);
	});

	it('finds external AI services and trackers', () => {
		expect(ids('fetch("https://api.openai.com/v1/chat/completions")')).toEqual(['ai-endpoint']);
		expect(ids("import Anthropic from '@anthropic-ai/sdk';")).toEqual(['ai-sdk']);
		expect(ids('from openai import OpenAI', 'bot.py')).toEqual(['ai-sdk']);
		expect(ids('<script src="https://www.googletagmanager.com/gtag/js"></script>')).toEqual([
			'tracker'
		]);
	});

	it('skips dependencies, builds, binaries, lock files and large files', () => {
		expect(scannable('src/lib/a.ts', 100)).toBe(true);
		expect(scannable('node_modules/x/index.js', 100)).toBe(false);
		expect(scannable('app/build/out.js', 100)).toBe(false);
		expect(scannable('pnpm-lock.yaml', 100)).toBe(false);
		expect(scannable('logo.png', 100)).toBe(false);
		expect(scannable('src/big.json', 2_000_000)).toBe(false);
	});

	it('counts findings per category', () => {
		const findings = scan([
			{ path: 'a.ts', content: 'AKIAABCDEFGHIJKLMNOP erika@firma.de api.anthropic.com' }
		]);
		expect(summarise(findings)).toEqual({ geheimnis: 1, personenbezug: 1, ki: 1, tracking: 0 });
	});
});
