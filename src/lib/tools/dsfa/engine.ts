import { addHours, dateAfterMonths, dayAt, monthsPassed } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordData, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import {
	assessRisks,
	complianceOpen,
	definition,
	measuresPending,
	RISKS,
	riskLevel,
	unbackedReductions,
	type RiskLevel
} from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const LEVEL: Record<RiskLevel, Localized> = {
	gering: L('geringes Risiko', 'low risk'),
	risiko: L('Risiko', 'risk'),
	hoch: L('hohes Risiko', 'high risk')
};

/** Art. 36(2): the authority advises within eight weeks, extendable by six */
const OPINION_WEEKS = 8;
const EXTENSION_WEEKS = 6;

/** WP 248 rev. 01: reassess a DPIA at the latest three years after it was approved */
const REASSESS_MONTHS = 36;

/** the day a reassessment falls due, three years after the approval */
function reassessDue(record: RecordView): string | null {
	const approved = record.data.freigegeben_am;
	return typeof approved === 'string' && approved
		? dateAfterMonths(approved, REASSESS_MONTHS)
		: null;
}

/** whether the approval is three years old or more on `now` and no later review is set */
export function reassessmentDue(record: RecordView, now = new Date()): boolean {
	const due = reassessDue(record);
	if (!due) return false;
	const review = record.data.ueberpruefung;
	if (typeof review === 'string' && review > due) return false;
	return monthsPassed(record.data.freigegeben_am as string, REASSESS_MONTHS, now);
}

const filled = (value: unknown) => typeof value === 'string' && value.trim() !== '';
const names = (list: Localized[], lang: 'de' | 'en') => list.map((l) => l[lang]).join(', ');

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
			dueAt: addHours(
				consulted,
				(OPINION_WEEKS + (record.data.frist_verlaengert === true ? EXTENSION_WEEKS : 0)) * 7 * 24
			),
			cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 2' }
		});
	}
	if (
		record.data.umgesetzt !== true &&
		filled(record.data.massnahmenplan) &&
		filled(record.data.massnahmen_bis)
	) {
		specs.push({
			kind: 'massnahmen',
			label: L('Abhilfemaßnahmen umsetzen', 'Implement the measures'),
			dueAt: dayAt(record.data.massnahmen_bis as string),
			cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. d' }
		});
	}
	if (typeof record.data.ueberpruefung === 'string') {
		specs.push({
			kind: 'ueberpruefung',
			label: L('Überprüfung der DSFA', 'DPIA review'),
			dueAt: dayAt(record.data.ueberpruefung),
			cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 11' }
		});
	} else {
		const due = reassessDue(record);
		if (due) {
			specs.push({
				kind: 'ueberpruefung',
				label: L('Erneute Bewertung der DSFA', 'Reassessment of the DPIA'),
				dueAt: dayAt(due),
				cite: { law: 'WP29', ref: 'WP 248 rev. 01' }
			});
		}
	}
	return specs;
}

/**
 * the risk picture before and after measures, then what Art. 35(7) still
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
	if (
		record.data.besondere_kategorien === true &&
		!filled(record.data.art9_ausnahme) &&
		!(Array.isArray(record.data.rechtsgrundlagen) && record.data.rechtsgrundlagen.includes('art9'))
	) {
		missing.push(L('die Ausnahme nach Art. 9 Abs. 2', 'the exception under Art. 9(2)'));
	}
	if (record.data.automatisiert === true && !filled(record.data.art22_garantien)) {
		missing.push(
			L(
				'Ausnahme und Garantien nach Art. 22 Abs. 2, 3',
				'exception and safeguards under Art. 22(2), (3)'
			)
		);
	}
	const unrated = risks.filter((r) => r.before === null);
	if (unrated.length > 0)
		missing.push(L('Bewertung aller Risiken (lit. c)', 'rating of all risks ((c))'));
	else if (risks.some((r) => !r.justified))
		missing.push(L('Begründung der Einstufungen (lit. c)', 'reasons for the ratings ((c))'));
	const unaddressed = risks.filter(
		(r) => r.before && r.before !== 'gering' && isEmpty(record.data[`${r.id}_massnahmen`])
	);
	const unbacked = unbackedReductions(record);
	if (unaddressed.length > 0 || unbacked.length > 0) {
		missing.push(L('Abhilfemaßnahmen (lit. d)', 'measures ((d))'));
	}
	if (unbacked.length > 0) {
		const list = (lang: 'de' | 'en') => unbacked.map((r) => r.title[lang]).join(', ');
		notes.push(
			L(
				`${list('de')}: Das Risiko ist nach Maßnahmen niedriger eingestuft, aber keine Abhilfemaßnahme ist benannt. Risiken sinken nur durch Maßnahmen; Übernahme oder Übertragung sind nicht möglich (SDM V3.1a, D3.1).`,
				`${list('en')}: the risk is rated lower after measures, but no measure is named. Only measures lower a risk; acceptance or transfer are not available (SDM V3.1a, D3.1).`
			)
		);
	}
	if (isEmpty(record.data.rechtsgrundlagen)) {
		notes.push(
			L(
				'Die Rechtsgrundlagen der Verarbeitung festhalten (DSK Kurzpapier Nr. 5, Schritt 6).',
				'Record the legal bases of the processing (DSK Kurzpapier Nr. 5, step 6).'
			)
		);
	}
	if (filled(record.data.notwendigkeit) && !filled(record.data.verhaeltnismaessigkeit)) {
		notes.push(
			L(
				'Die Verhältnismäßigkeit eigens abwägen: Überwiegt der Nutzen die Nachteile für die Betroffenen? Die Notwendigkeit allein genügt nicht (Art. 35 Abs. 7 lit. b).',
				'Weigh proportionality on its own: do the benefits outweigh the disadvantages for the data subjects? Necessity alone is not enough (Art. 35(7)(b)).'
			)
		);
	}
	const compliance = complianceOpen(record);
	if (compliance.unset.length > 0) {
		notes.push(
			L(
				`Noch nicht eingeschätzt: ${names(compliance.unset, 'de')} (Art. 35 Abs. 7 lit. d, EDPB-Vorlage 2026, 2.3).`,
				`Not yet assessed: ${names(compliance.unset, 'en').toLowerCase()} (Art. 35(7)(d), EDPB template 2026, 2.3).`
			)
		);
	}
	if (compliance.pending.length > 0) {
		notes.push(
			L(
				`Noch nicht vollständig umgesetzt: ${names(compliance.pending, 'de')}. Vor Beginn der Verarbeitung umsetzen oder nur mit Auflagen freigeben.`,
				`Not yet fully implemented: ${names(compliance.pending, 'en').toLowerCase()}. Implement before processing starts, or sign off only with conditions.`
			)
		);
	}
	if (record.state === 'bewertet' && measuresPending(record)) {
		notes.push(
			L(
				'Vor der Freigabe die Abhilfemaßnahmen umsetzen, auf Wirksamkeit testen und das im Ergebnis bestätigen (DSK Kurzpapier Nr. 5, Schritte 11 und 12).',
				'Before sign-off, implement the measures, test that they work and confirm this in the outcome (DSK Kurzpapier Nr. 5, steps 11 and 12).'
			)
		);
	}

	const unsourced = risks.filter((r) => r.before && r.threats.length === 0);
	if (unsourced.length > 0) {
		const list = (lang: 'de' | 'en') => unsourced.map((r) => r.title[lang]).join(', ');
		notes.push(
			L(
				`Für ${list('de')} sind keine Gefährdungen ausgewählt; die Risikoquellen sollten benannt sein (DSK Kurzpapier Nr. 5, Schritt 7).`,
				`No threats are chosen for ${list('en')}; the sources of risk should be named (DSK Kurzpapier Nr. 5, step 7).`
			)
		);
	}
	if (risks.some((r) => r.before) && isEmpty(record.data.tom)) {
		notes.push(
			L(
				'Den Eintrag des Systems im TOM-Katalog verknüpfen, damit die Abhilfemaßnahmen je Gewährleistungsziel mit den umgesetzten Maßnahmen abgeglichen werden.',
				'Link the system’s entry in the TOM catalogue so the measures are compared goal by goal with those in place.'
			)
		);
	}
	if (isEmpty(record.data.dsb)) {
		notes.push(
			L(
				'Den Rat des Datenschutzbeauftragten einholen und festhalten (Art. 35 Abs. 2).',
				'Seek and record the advice of the data protection officer (Art. 35(2)).'
			)
		);
	} else if (isEmpty(record.data.dsb_umsetzung)) {
		notes.push(
			L(
				'Festhalten, wie der Rat des Datenschutzbeauftragten umgesetzt wurde.',
				'Record how the advice of the data protection officer was followed.'
			)
		);
	}
	if (isEmpty(record.data.standpunkt)) {
		notes.push(
			L(
				'Den Standpunkt der Betroffenen oder ihrer Vertreter einholen, oder festhalten, warum nicht (Art. 35 Abs. 9).',
				'Seek the views of the data subjects or their representatives, or record why not (Art. 35(9)).'
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
	if (reassessmentDue(record)) {
		notes.push(
			L(
				'Die Freigabe liegt drei Jahre oder länger zurück: die DSFA erneut bewerten, auch wenn sich nichts erkennbar geändert hat (WP 248 rev. 01).',
				'The approval is three years old or more: reassess the DPIA, even if nothing has visibly changed (WP 248 rev. 01).'
			)
		);
	}
	if (isEmpty(record.data.ueberpruefung) && isEmpty(record.data.freigegeben_am)) {
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

	const proceeds = record.data.beschluss === 'durchfuehren' || record.data.beschluss === 'auflagen';
	if (high.length > 0 && proceeds) {
		notes.push(
			L(
				'Die Entscheidung lautet auf Durchführung, obwohl ein hohes Restrisiko bleibt; vorher ist die Aufsichtsbehörde zu konsultieren.',
				'The decision is to proceed although a high residual risk remains; the authority must be consulted first.'
			)
		);
	}

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

/**
 * the screening's reasons become the reason for the DPIA, in German like
 * the rest of the entry. Text the user wrote is never overwritten.
 */
function fromAssessment(
	field: string,
	result: QuestionnaireResult,
	record: RecordView
): RecordData {
	if (field !== 'schwellwert' || !isEmpty(record.data.anlass)) return {};
	if (result.reasons.length === 0) return {};
	return {
		anlass: result.reasons
			.map((reason) =>
				reason.cite
					? `– ${reason.text.de} (${reason.cite.ref} ${reason.cite.law})`
					: `– ${reason.text.de}`
			)
			.join('\n')
	};
}

export const engine: RecordEngine = { deadlines, assess, fromAssessment };
export { definition, RISKS, riskLevel };
