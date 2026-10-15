import type { Answers, QuestionnaireCatalog, QuestionnaireResult, Reason } from '../types.js';

const ART35_IDS = ['art35_a', 'art35_b', 'art35_c'];
const DSK_ID = 'dsk_list';
const CRITERIA_IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];

/**
 * decision rule, in order of precedence:
 *   1. any statutory example (Art. 35 Abs. 3) answered yes  → required
 *   2. processing is on the DSK must-list                    → required
 *   3. two or more WP 248 criteria                           → required
 *   4. exactly one criterion                                 → consider and document
 *   5. none                                                  → not required
 * "unknown" answers never count as yes; the result says when they exist.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const questions = new Map(catalog.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));
	const yes = (id: string) => answers[id] === 'yes';
	const reasonFor = (id: string): Reason => {
		const question = questions.get(id);
		return {
			questionId: id,
			text: question?.text ?? { de: id, en: id },
			cite: question?.cite
		};
	};

	const statutory = ART35_IDS.filter(yes).map(reasonFor);
	const dsk = yes(DSK_ID) ? [reasonFor(DSK_ID)] : [];
	const criteria = CRITERIA_IDS.filter(yes).map(reasonFor);
	const unknown = Object.values(answers).filter((value) => value === 'unknown').length;
	const unknownNote = unknown
		? {
				de: ` ${unknown} Frage(n) wurden mit „unklar“ beantwortet; diese Punkte sind vor der endgültigen Entscheidung zu klären.`,
				en: ` ${unknown} question(s) were answered "unclear"; resolve these before the final decision.`
			}
		: { de: '', en: '' };

	if (statutory.length > 0 || dsk.length > 0) {
		return {
			verdict: 'positive',
			headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' },
			explanation: {
				de:
					(statutory.length > 0
						? 'Ein gesetzliches Regelbeispiel des Art. 35 Abs. 3 DSGVO trifft zu.'
						: 'Die Verarbeitung steht auf der Muss-Liste der Datenschutzkonferenz (Art. 35 Abs. 4 DSGVO).') +
					' Die Folgenabschätzung ist vor Beginn der Verarbeitung durchzuführen; der Datenschutzbeauftragte ist nach Art. 35 Abs. 2 zu Rate zu ziehen.' +
					unknownNote.de,
				en:
					(statutory.length > 0
						? 'A statutory example under Art. 35(3) GDPR applies.'
						: 'The processing is on the DSK must-list (Art. 35(4) GDPR).') +
					' The impact assessment must be carried out before processing starts; the data protection officer must be consulted under Art. 35(2).' +
					unknownNote.en
			},
			reasons: [...statutory, ...dsk, ...criteria],
			citations: catalog.sources
		};
	}

	if (criteria.length >= 2) {
		return {
			verdict: 'positive',
			headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' },
			explanation: {
				de: `${criteria.length} der neun Kriterien der Artikel-29-Gruppe treffen zu. Nach WP 248 ist bei zwei oder mehr Kriterien in den meisten Fällen von einem voraussichtlich hohen Risiko auszugehen.${unknownNote.de}`,
				en: `${criteria.length} of the nine Article 29 Working Party criteria apply. Under WP 248, two or more criteria indicate a likely high risk in most cases.${unknownNote.en}`
			},
			reasons: criteria,
			citations: catalog.sources
		};
	}

	if (criteria.length === 1) {
		return {
			verdict: 'conditional',
			headline: { de: 'DSFA zu erwägen.', en: 'DPIA to be considered.' },
			explanation: {
				de: `Ein Kriterium trifft zu. Eine DSFA ist nicht zwingend, die Entscheidung dagegen ist jedoch mit Begründung zu dokumentieren (Rechenschaftspflicht, Art. 5 Abs. 2 DSGVO).${unknownNote.de}`,
				en: `One criterion applies. A DPIA is not mandatory, but a decision not to carry one out must be documented with reasons (accountability, Art. 5(2) GDPR).${unknownNote.en}`
			},
			reasons: criteria,
			citations: catalog.sources
		};
	}

	return {
		verdict: 'negative',
		headline: { de: 'Keine DSFA erforderlich.', en: 'No DPIA required.' },
		explanation: {
			de: `Weder ein Regelbeispiel noch ein Eintrag der Muss-Liste noch ein WP-248-Kriterium trifft zu. Das Ergebnis ist zu dokumentieren und bei wesentlichen Änderungen der Verarbeitung zu wiederholen (Art. 35 Abs. 11 DSGVO).${unknownNote.de}`,
			en: `No statutory example, must-list entry or WP 248 criterion applies. Document the outcome and repeat the screening when the processing changes materially (Art. 35(11) GDPR).${unknownNote.en}`
		},
		reasons: [],
		citations: catalog.sources
	};
}
