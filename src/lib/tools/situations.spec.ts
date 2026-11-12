import { describe, expect, it } from 'vitest';
import { ICONS } from '../ui/icons.js';
import { getTool } from './registry.js';
import { SITUATIONS, SITUATIONS_SHOWN } from './situations.js';

describe('situations', () => {
	it('each open a built tool and use a known icon', () => {
		for (const situation of SITUATIONS) {
			const tool = getTool(situation.tool);
			expect(tool, situation.id).toBeDefined();
			expect(tool!.status, situation.id).not.toBe('planned');
			expect(ICONS, situation.id).toHaveProperty(situation.icon);
		}
	});

	it('have unique ids and keep some behind "Weitere Anlässe"', () => {
		expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
		expect(SITUATIONS.length).toBeGreaterThan(SITUATIONS_SHOWN);
	});

	it('start with the situations that run against a deadline', () => {
		expect(SITUATIONS.slice(0, 2).map((s) => s.tool)).toEqual(['datenpanne', 'betroffenenanfrage']);
	});
});
