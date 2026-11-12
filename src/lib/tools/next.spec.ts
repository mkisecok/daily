import { describe, expect, it } from 'vitest';
import { nextSteps } from './next.js';
import { getQuestionnaire, getRecordTool, tools } from './registry.js';
import type { QuestionnaireResult, VerdictLevel } from './types.js';

const result = (verdict: VerdictLevel, outcome?: string): QuestionnaireResult => ({
	verdict,
	outcome,
	headline: { de: '', en: '' },
	explanation: { de: '', en: '' },
	reasons: [],
	citations: []
});

describe('next steps', () => {
	it('point only to tools that exist, as a check or as an entry', () => {
		const outcomes = [
			'verboten',
			'kein-ki',
			'ausserhalb',
			'hochrisiko',
			'art6-3',
			'art50',
			'minimal',
			undefined
		];
		for (const tool of tools) {
			for (const verdict of ['positive', 'conditional', 'negative'] as const) {
				for (const outcome of outcomes) {
					for (const step of nextSteps(tool.slug, result(verdict, outcome))) {
						const where = `${tool.slug} ${verdict} ${outcome} → ${step.tool}`;
						if (step.mode === 'pruefen') expect(getQuestionnaire(step.tool), where).toBeDefined();
						else expect(getRecordTool(step.tool), where).toBeDefined();
						expect(step.why.de.length, where).toBeGreaterThan(0);
					}
				}
			}
		}
	});

	it('follow the risk class', () => {
		const tools = (outcome: string) =>
			nextSteps('risikoklassifizierung', result('positive', outcome)).map((s) => s.tool);
		expect(tools('verboten')).toEqual([]);
		expect(tools('kein-ki')).toEqual(['software-einfuehrung']);
		expect(tools('hochrisiko')).toEqual([
			'betreiberpflichten',
			'grundrechte-folgenabschaetzung',
			'ki-register',
			'ki-einfuehrung'
		]);
		expect(tools('art50')[0]).toBe('transparenzpflichten');
	});

	it('lead from a DPIA screening that requires one to the DPIA', () => {
		expect(nextSteps('dsfa-schwellwert', result('positive')).map((s) => [s.tool, s.mode])).toEqual([
			['dsfa', 'neu'],
			['vvt', 'neu']
		]);
	});
});
