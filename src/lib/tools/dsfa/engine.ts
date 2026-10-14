import { addHours, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { assessRisks, definition, RISKS, riskLevel, type RiskLevel } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const LEVEL: Record<RiskLevel, Localized> = {
	gering: L('geringes Risiko', 'low risk'),
	risiko: L('Risiko', 'risk'),
	hoch: L('hohes Risiko', 'high risk')
};

/** Art. 36(2): the authority advises within eight weeks, extendable by six. */
const OPINION_WEEKS = 8;

function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const consulted = record.data.konsultation_am;
	if (
		record.state === 'konsultation' &&
		typeof consulted === 'string' &&
		isEmpty(record.data.stellungnahme)
	) {
		specs.push({
			kind: 'stellungnahme',
			label: L('Stellungnahme der Aufsichtsbehörde erwartet', 'Opinion of the authority expected'),
			dueAt: addHours(consulted, OPINION_WEEKS * 7 * 24),
			cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 2' }
		});
	}
	if (typeof record.data.ueberpruefung === 'string') {
		specs.push({
			kind: 'ueberpruefung',
			label: L('Überprüfung der DSFA', 'DPIA review'),
			dueAt: dayAt(record.data.ueberpruefung),
			cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 11' }
		});
	}
	return specs;
}

/**
 * The risk picture before and after measures, then what Art. 35(7) still
 * lacks. A high residual risk requires prior consultation (Art. 36(1)).
 */
function assess(record: RecordView): QuestionnaireResult {
	const risks = assessRisks(record);
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 35' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 18' }
	];
	const notes: Localized[] = risks
		.filter((r) => r.before)
		.map((r) => {
			const before = LEVEL[r.before!];
			const after = LEVEL[r.after ?? r.before!];
			return L(
				`${r.title.de}: ${before.de} → nach Maßnahmen ${after.de}.`,
				`${r.title.en}: ${before.en} → after measures ${after.en}.`
			);
		});

	const missing: Localized[] = [];
	if (isEmpty(record.data.verarbeitung) || isEmpty(record.data.zwecke)) {
		missing.push(L('Beschreibung und Zwecke (lit. a)', 'description and purposes ((a))'));
	}
	if (isEmpty(record.data.notwendigkeit)) {
		missing.push(
			L('Notwendigkeit und Verhältnismäßigkeit (lit. b)', 'necessity and proportionality ((b))')
		);
	}
	const unrated = risks.filter((r) => r.before === null);
	if (unrated.length > 0)
		missing.push(L('Bewertung aller Risiken (lit. c)', 'rating of all risks ((c))'));
	const unaddressed = risks.filter(
		(r) => r.before && r.before !== 'gering' && isEmpty(record.data[`${r.id}_massnahmen`])
	);
	if (unaddressed.length > 0) missing.push(L('Abhilfemaßnahmen (lit. d)', 'measures ((d))'));

	if (isEmpty(record.data.dsb)) {
		notes.push(
			L(
				'Den Rat des Datenschutzbeauftragten einholen und festhalten (Art. 35 Abs. 2).',
				'Seek and record the advice of the data protection officer (Art. 35(2)).'
			)
		);
	}
	if (!record.data.schwellwert) {
		notes.push(
			L(
				'Die DSFA-Schwellwertanalyse anhängen, damit dokumentiert ist, warum die DSFA durchgeführt wird.',
				'Attach the DPIA screening so that the reason for the DPIA is documented.'
			)
		);
	}
	if (isEmpty(record.data.ueberpruefung)) {
		notes.push(
			L(
				'Einen Überprüfungstermin festlegen; bei Änderungen des Risikos ist die DSFA zu wiederholen (Art. 35 Abs. 11).',
				'Set a review date; the DPIA must be repeated when the risk changes (Art. 35(11)).'
			)
		);
	}

	const high: Reason[] = risks
		.filter((r) => r.after === 'hoch')
		.map((r) => ({
			questionId: r.id,
			text: r.title,
			cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 1' }
		}));

	if (high.length > 0) {
		citations.push({ law: 'DSGVO', ref: 'Art. 36' });
		return {
			verdict: 'positive',
			outcome: 'konsultation',
			headline: L(
				'Hohes Restrisiko: Aufsichtsbehörde vorher konsultieren.',
				'High residual risk: consult the authority beforehand.'
			),
			explanation: L(
				'Auch nach den Abhilfemaßnahmen bleibt für die folgenden Risiken ein hohes Risiko. Vor Beginn der Verarbeitung ist die Aufsichtsbehörde zu konsultieren (Art. 36 Abs. 1); sie äußert sich binnen acht Wochen, verlängerbar um sechs.',
				'Even after the measures a high risk remains for the risks below. Before processing starts the authority must be consulted (Art. 36(1)); it responds within eight weeks, extendable by six.'
			),
			reasons: high,
			notes,
			citations
		};
	}
	if (missing.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('DSFA unvollständig.', 'DPIA incomplete.'),
			explanation: L(
				`Nach Art. 35 Abs. 7 fehlen noch: ${missing.map((m) => m.de).join(', ')}.`,
				`Still missing under Art. 35(7): ${missing.map((m) => m.en).join(', ')}.`
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'vertretbar',
		headline: L('Restrisiko vertretbar.', 'Residual risk acceptable.'),
		explanation: L(
			'Die Abhilfemaßnahmen senken alle Risiken unter die Schwelle des hohen Risikos. Die Verarbeitung kann nach Entscheidung des Verantwortlichen beginnen; die DSFA bleibt bei Änderungen zu überprüfen.',
			'The measures bring all risks below the high-risk threshold. Processing may start after the controller’s decision; the DPIA must be reviewed when anything changes.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition, RISKS, riskLevel };
