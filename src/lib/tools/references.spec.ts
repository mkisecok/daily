import { describe, expect, it } from 'vitest';
import { referenceFields } from '../records/links.js';
import { allFields } from '../records/validate.js';
import { getRecordTool, listRecordTools } from './registry.js';

describe('links between registers', () => {
	it('gives every field of a register its own id', () => {
		for (const tool of listRecordTools()) {
			const ids = allFields(tool.definition).map((field) => field.id);
			expect(
				ids.filter((id, i) => ids.indexOf(id) !== i),
				tool.manifest.slug
			).toEqual([]);
		}
	});

	it('points every reference field to a register that exists', () => {
		for (const tool of listRecordTools()) {
			for (const field of referenceFields(tool.definition)) {
				expect(getRecordTool(field.tool), `${tool.manifest.slug}.${field.id}`).toBeDefined();
			}
		}
	});

	it('links DSFA, breaches, processor checks and TOM to the VVT, and the FRIA to the AI register', () => {
		const links = (slug: string) =>
			referenceFields(getRecordTool(slug)!.definition).map((f) => [f.id, f.tool]);
		expect(links('dsfa')).toEqual([['vvt', 'vvt']]);
		expect(links('datenpanne')).toEqual([['vvt', 'vvt']]);
		expect(links('avv-pruefung')).toEqual([['vvt', 'vvt']]);
		expect(links('tom-katalog')).toEqual([['vvt', 'vvt']]);
		expect(links('grundrechte-folgenabschaetzung')).toEqual([['ki_eintrag', 'ki-register']]);
	});
});
