import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import { signOffChecks } from './signoff.js';

const status = (data: RecordData) =>
	Object.fromEntries(signOffChecks({ state: 'bewertet', data }).map((c) => [c.id, c.status]));

describe('DSFA: checks before sign-off', () => {
	it('leaves everything open on an empty entry, with nothing to implement', () => {
		expect(status({})).toEqual({
			rechtsgrundlagen: 'offen',
			senkung: 'erfuellt',
			restrisiko: 'offen',
			umsetzung: 'entfaellt'
		});
	});

	it('names the risks lowered without a measure', () => {
		const checks = signOffChecks({
			state: 'bewertet',
			data: { integritaet_w: '3', integritaet_s: '3', integritaet_rw: '1', integritaet_rs: '1' }
		});
		const senkung = checks.find((c) => c.id === 'senkung')!;
		expect(senkung.status).toBe('offen');
		expect(senkung.detail?.de).toBe('Unbefugte Veränderung');
	});

	it('asks for the measures to be in place once any is named', () => {
		const named = {
			rechtsgrundlagen: ['vertrag'],
			restrisiko: 'Vertretbar',
			integritaet_w: '3',
			integritaet_s: '3',
			integritaet_massnahmen: 'Vier-Augen-Prinzip',
			integritaet_rw: '1',
			integritaet_rs: '1'
		};
		expect(status(named)).toEqual({
			rechtsgrundlagen: 'erfuellt',
			senkung: 'erfuellt',
			restrisiko: 'erfuellt',
			umsetzung: 'offen'
		});
		expect(status({ ...named, umgesetzt: true }).umsetzung).toBe('erfuellt');
	});
});
