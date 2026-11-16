import { describe, expect, it } from 'vitest';
import { getRecordTool, tools } from './registry.js';
import { validateRecord } from '../records/validate.js';
import { lessonEntry, LESSON_REGISTER } from './lesson-entry.js';

describe('a session of a lesson', () => {
	it('pre-fills a valid Schulungsnachweis entry with topic, date and the module', () => {
		const data = lessonEntry('schulung-datenpanne', 'de', new Date(2026, 10, 16))!;
		expect(data).toMatchObject({
			titel: 'Datenpannen erkennen und melden',
			themen: ['pannen'],
			datum: '2026-11-16',
			form: 'praesenz',
			zielgruppe: 'Alle Beschäftigten'
		});
		expect(data.notizen).toContain('Stand 1');
		const { definition } = getRecordTool(LESSON_REGISTER)!;
		expect(validateRecord(definition, data).errors).toEqual({});
	});

	it('is nothing for a slug that is not a lesson', () => {
		expect(lessonEntry('vvt', 'de')).toBeNull();
	});

	it('fills the AI literacy part for the AI module, and every lesson gives a valid entry', () => {
		expect(lessonEntry('schulung-ki', 'de')).toMatchObject({
			themen: ['ki'],
			ki_befassung: 'anwendung',
			ki_inhalte: expect.arrayContaining(['risiken', 'daten', 'richtlinie'])
		});
		const { definition } = getRecordTool(LESSON_REGISTER)!;
		for (const tool of tools.filter((t) => t.shape === 'lesson')) {
			expect(validateRecord(definition, lessonEntry(tool.slug, 'de')!).errors, tool.slug).toEqual(
				{}
			);
		}
	});
});
