import { describe, expect, it } from 'vitest';
import {
	BSI_THREATS,
	DS_THREATS,
	THREATS,
	threatById,
	threatsFor,
	type SdmGoal
} from './threats.js';

const GOALS: SdmGoal[] = [
	'vertraulichkeit',
	'integritaet',
	'verfuegbarkeit',
	'datenminimierung',
	'nichtverkettung',
	'transparenz',
	'intervenierbarkeit'
];

describe('DSFA: threat catalogue', () => {
	it('holds the 47 elementary threats of BSI-Standard 200-3 in order', () => {
		expect(BSI_THREATS.map((t) => t.id)).toEqual(
			Array.from({ length: 47 }, (_, i) => `G 0.${i + 1}`)
		);
		expect(DS_THREATS.map((t) => t.id)).toEqual(
			Array.from({ length: 10 }, (_, i) => `DS ${i + 1}`)
		);
	});

	it('gives every threat a goal, a title and a focus in both languages', () => {
		for (const threat of THREATS) {
			expect(threat.goals.length, threat.id).toBeGreaterThan(0);
			expect(
				threat.goals.every((goal) => GOALS.includes(goal)),
				threat.id
			).toBe(true);
			for (const value of [threat.title, threat.focus]) {
				expect(value.de.trim() && value.en.trim(), threat.id).toBeTruthy();
			}
		}
		expect(new Set(THREATS.map((t) => t.id)).size).toBe(THREATS.length);
	});

	it('keeps the BSI basic values, which only the BSI threats carry', () => {
		expect(threatById('G 0.1')?.cia).toEqual(['A']);
		expect(threatById('G 0.23')?.cia).toEqual(['C', 'I']);
		expect(threatById('G 0.47')?.cia).toEqual(['C', 'I', 'A']);
		expect(DS_THREATS.every((t) => t.cia.length === 0)).toBe(true);
	});

	it('maps a security threat to confidentiality only where secrecy is at stake', () => {
		const confidentiality = threatsFor('vertraulichkeit').map((t) => t.id);
		expect(confidentiality).toContain('G 0.15');
		expect(confidentiality).not.toContain('G 0.1');
	});

	it('gives every goal threats, including data protection events for the SDM-only goals', () => {
		for (const goal of GOALS) expect(threatsFor(goal).length, goal).toBeGreaterThan(0);
		for (const goal of ['datenminimierung', 'nichtverkettung', 'transparenz'] as const) {
			expect(
				threatsFor(goal).some((t) => t.id.startsWith('DS')),
				goal
			).toBe(true);
		}
		// planning errors and unlawfulness touch every goal
		for (const goal of GOALS) {
			expect(threatsFor(goal).map((t) => t.id)).toEqual(
				expect.arrayContaining(['G 0.18', 'G 0.29'])
			);
		}
	});
});
