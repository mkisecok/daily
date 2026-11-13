import { describe, expect, it } from 'vitest';
import { incidentParts } from './print.js';

const answer = (data: Record<string, unknown>, label: string) =>
	incidentParts(data as never, 'erfasst', 'de')
		.flatMap((part) => part.rows)
		.find((row) => row.label === label)?.value;

describe('AI incident report on paper', () => {
	it('names the period that applies and when it ends', () => {
		const aware = { kenntnis: '2026-11-10T08:00:00.000Z' };
		expect(answer(aware, 'Meldefrist')).toBe('15 Tage (Art. 73 Abs. 2)');
		expect(answer(aware, 'Frist endet')).toBe('25.11.2026 23:59');
		expect(answer({ ...aware, todesfall: true }, 'Meldefrist')).toBe('10 Tage (Art. 73 Abs. 4)');
		expect(answer({ ...aware, weitverbreitet: true }, 'Meldefrist')).toBe(
			'2 Tage (Art. 73 Abs. 3)'
		);
	});

	it('says whether the report made it', () => {
		const aware = { kenntnis: '2026-11-10T08:00:00.000Z' };
		expect(answer(aware, 'Fristgerecht')).toBe('Noch nicht gemeldet');
		expect(answer({ ...aware, gemeldet_am: '2026-11-20T09:00:00.000Z' }, 'Fristgerecht')).toBe(
			'Ja'
		);
		expect(answer({ ...aware, gemeldet_am: '2026-11-27T09:00:00.000Z' }, 'Fristgerecht')).toBe(
			'Nein'
		);
	});

	it('asks a deployer when the provider was told', () => {
		expect(answer({ rolle: 'betreiber' }, 'Anbieter informiert am (Art. 26 Abs. 5)')).toBe('');
		expect(
			answer({ rolle: 'anbieter' }, 'Anbieter informiert am (Art. 26 Abs. 5)')
		).toBeUndefined();
	});
});
