import { describe, expect, it } from 'vitest';
import { engine } from './engine.js';

const view = (data: Record<string, unknown>) => ({ state: null, data }) as never;

describe('Beratungsvermerk', () => {
	it('reminds to ask again while the follow-up is open', () => {
		expect(engine.deadlines!(view({ nachfragen_am: '2026-11-24' }))).toHaveLength(1);
		expect(
			engine.deadlines!(view({ nachfragen_am: '2026-11-24', umsetzung: 'offen' }))
		).toHaveLength(1);
	});

	it('stops once the outcome is recorded', () => {
		for (const umsetzung of ['gefolgt', 'teilweise', 'nicht_gefolgt']) {
			expect(engine.deadlines!(view({ nachfragen_am: '2026-11-24', umsetzung }))).toEqual([]);
		}
	});
});
