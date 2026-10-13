import { describe, expect, it } from 'vitest';
import { isRelevant, tagText } from './tagging.js';

describe('tagText', () => {
	it('tags a German fine headline with regulation and kind', () => {
		const tags = tagText('Italienische Aufsicht verhängt Bußgeld von 16,7 Mio € nach DSGVO');
		expect(tags).toContain('dsgvo');
		expect(tags).toContain('bussgeld');
		expect(tags).toContain('aufsicht');
	});

	it('tags English AI Act news', () => {
		const tags = tagText(
			'Commission publishes guidelines on high-risk AI systems under the AI Act'
		);
		expect(tags).toEqual(expect.arrayContaining(['ki-vo', 'gesetzgebung', 'leitlinie']));
	});

	it('tags court news as case law', () => {
		const tags = tagText('Urteil des Gerichtshofs in der Rechtssache C-108/26');
		expect(tags).toContain('rechtsprechung');
	});

	it('uses the excerpt as well as the title', () => {
		expect(tagText('Neue Pflichten', 'Die KI-Verordnung verlangt …')).toContain('ki-vo');
	});

	it('returns no duplicates', () => {
		const tags = tagText('DSGVO DSGVO GDPR');
		expect(new Set(tags).size).toBe(tags.length);
	});

	it('finds nothing in unrelated news', () => {
		expect(tagText('Mondlandefahrzeug ist bereit für den Flug zum Mond')).toEqual([]);
	});
});

describe('isRelevant', () => {
	it('requires a regulation tag, not just a kind tag', () => {
		expect(isRelevant(['bussgeld'])).toBe(false);
		expect(isRelevant(['bussgeld', 'dsgvo'])).toBe(true);
		expect(isRelevant([])).toBe(false);
	});
});
