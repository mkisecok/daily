import { describe, expect, it } from 'vitest';
import { fieldById } from '../records/validate.js';
import { getLesson, getRecordTool, tools } from './registry.js';
import type { Localized } from './types.js';

const lessons = tools.filter((tool) => tool.shape === 'lesson');
const topics = (() => {
	const field = fieldById(getRecordTool('schulungsnachweis')!.definition, 'themen');
	return field && 'options' in field ? field.options.map((option) => option.value) : [];
})();
/** the places in square brackets the organisation fills in */
const blanks = (value: Localized, lang: 'de' | 'en') => value[lang].match(/\[[^\]]+\]/g) ?? [];

describe('lessons', () => {
	it('exist, sit in the area Schulung and count as a Schulungsnachweis topic', () => {
		expect(lessons.length).toBeGreaterThan(0);
		for (const tool of lessons) {
			const lesson = getLesson(tool.slug);
			expect(lesson, tool.slug).toBeDefined();
			expect(tool.category, tool.slug).toBe('schulung');
			expect(tool.version, tool.slug).toBe(lesson!.version);
			expect(topics, tool.slug).toContain(lesson!.topic);
		}
	});

	it('stay short: at most fifteen slides of five points and half an hour', () => {
		for (const tool of lessons) {
			const lesson = getLesson(tool.slug)!;
			expect(lesson.slides.length, tool.slug).toBeLessThanOrEqual(15);
			expect(lesson.minutes, tool.slug).toBeLessThanOrEqual(30);
			for (const slide of lesson.slides) {
				expect(slide.points.length, slide.title.de).toBeGreaterThan(0);
				expect(slide.points.length, slide.title.de).toBeLessThanOrEqual(5);
			}
		}
	});

	it('cite the provisions on every slide', () => {
		for (const tool of lessons) {
			for (const slide of getLesson(tool.slug)!.slides) {
				expect(slide.cite?.length ?? 0, slide.title.de).toBeGreaterThan(0);
			}
		}
	});

	it('leave the same places open in German and English', () => {
		for (const tool of lessons) {
			for (const slide of getLesson(tool.slug)!.slides) {
				for (const value of [
					slide.title,
					...slide.points,
					...(slide.example ? [slide.example] : [])
				]) {
					expect(blanks(value, 'en').length, value.de).toBe(blanks(value, 'de').length);
					expect(value.de.split('[').length, value.de).toBe(value.de.split(']').length);
				}
			}
		}
	});

	it('end with three to five questions, each with exactly one right answer and a reason', () => {
		for (const tool of lessons) {
			const quiz = getLesson(tool.slug)!.quiz;
			expect(quiz.length, tool.slug).toBeGreaterThanOrEqual(3);
			expect(quiz.length, tool.slug).toBeLessThanOrEqual(5);
			for (const question of quiz) {
				expect(
					question.options.filter((o) => o.correct),
					question.text.de
				).toHaveLength(1);
				expect(question.options.length, question.text.de).toBeGreaterThanOrEqual(2);
				for (const option of question.options) expect(option.why.de, option.text.de).not.toBe('');
				expect(question.cite, question.text.de).toBeDefined();
			}
		}
	});
});
