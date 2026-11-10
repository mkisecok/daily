import type { RecordView } from '../../records/types.js';
import { GOALS } from '../tom-katalog/definition.js';
import type { Localized } from '../types.js';
import { assessRisks, type AssessedRisk, type RiskLevel } from './definition.js';

/**
 * how a goal stands against the TOM catalogue: `abgedeckt` has measures in
 * place, `luecke` is assessed but has none, `unbelegt` claims a lower
 * residual risk without any measure behind it, `offen` is not assessed yet
 */
export type CoverageStatus = 'abgedeckt' | 'luecke' | 'unbelegt' | 'offen';

export type GoalCoverage = {
	risk: AssessedRisk;
	/** the goal's name as the TOM catalogue has it, e.g. "Vertraulichkeit" */
	goal: Localized;
	/** labels of the measures the TOM entry records for this goal */
	measures: Localized[];
	status: CoverageStatus;
};

/** SDM V3.1a, D3.3: the initial risk sets the protection need of the data subjects */
export type ProtectionNeed = 'normal' | 'hoch';

export type TomComparison = {
	goals: GoalCoverage[];
	/** from the highest initial risk; null while nothing is rated */
	need: ProtectionNeed | null;
	/** what the TOM entry states, `normal`, `hoch` or `sehr_hoch` */
	tomNeed: string | null;
	/** the TOM entry assumes a lower protection need than the DPIA shows */
	needTooLow: boolean;
};

const ORDER: Record<RiskLevel, number> = { gering: 0, risiko: 1, hoch: 2 };
const NEED_ORDER: Record<string, number> = { normal: 0, hoch: 1, sehr_hoch: 2 };

/** high initial risk means high protection need; no or normal risk means normal */
export function protectionNeed(risks: AssessedRisk[]): ProtectionNeed | null {
	const rated = risks.filter((risk) => risk.before);
	if (rated.length === 0) return null;
	return rated.some((risk) => risk.before === 'hoch') ? 'hoch' : 'normal';
}

function measuresFor(tom: RecordView, goal: string): Localized[] {
	const section = GOALS.find((g) => g.id === goal);
	const field = section?.fields.find((f) => f.id === `${goal}_massnahmen`);
	const chosen = tom.data[`${goal}_massnahmen`];
	if (field?.type !== 'multiselect' || !Array.isArray(chosen)) return [];
	return field.options.filter((o) => chosen.includes(o.value)).map((o) => o.label);
}

function status(risk: AssessedRisk, measures: Localized[]): CoverageStatus {
	if (measures.length > 0) return 'abgedeckt';
	if (!risk.before && risk.threats.length === 0) return 'offen';
	const lowered = risk.before && risk.after && ORDER[risk.after] < ORDER[risk.before];
	return lowered ? 'unbelegt' : 'luecke';
}

/**
 * each risk of the DPIA beside the measures the linked TOM entry records for
 * the same SDM goal, and the protection need both assume
 */
export function compareWithTom(dsfa: RecordView, tom: RecordView): TomComparison {
	const risks = assessRisks(dsfa);
	const goals = risks.map((risk): GoalCoverage => {
		const measures = measuresFor(tom, risk.goal);
		const section = GOALS.find((g) => g.id === risk.goal);
		return {
			risk,
			goal: section?.title ?? risk.title,
			measures,
			status: status(risk, measures)
		};
	});
	const need = protectionNeed(risks);
	const tomNeed = typeof tom.data.schutzbedarf === 'string' ? tom.data.schutzbedarf : null;
	return {
		goals,
		need,
		tomNeed,
		needTooLow: need !== null && tomNeed !== null && (NEED_ORDER[tomNeed] ?? 0) < NEED_ORDER[need]
	};
}
