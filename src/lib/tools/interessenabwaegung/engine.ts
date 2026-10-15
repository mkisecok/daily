import { reasonFor } from '../checklist.js';
import type {
	Answers,
	Localized,
	QuestionnaireCatalog,
	QuestionnaireResult,
	Reason
} from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

const INTEREST = ['i_lawful', 'i_specific', 'i_present'];
const NECESSITY = ['n_suitable', 'n_less', 'n_minimal'];
/** "Yes" weighs against the processing; children count double */
const AGAINST: Record<string, number> = { a_special: 1, a_children: 2, a_scale: 1, a_impact: 1 };
/** "Yes" weighs in favour. An unexpected processing ("no" on f_expected) weighs against. */
const FOR = ['f_expected', 'f_relationship', 'f_safeguards', 'f_objection'];

const DOCUMENT = L(
	'Die Abwägung schriftlich festhalten (Rechenschaftspflicht, Art. 5 Abs. 2) und das berechtigte Interesse in den Informationen nach Art. 13 Abs. 1 lit. d bzw. Art. 14 Abs. 2 lit. b nennen.',
	'Record the balancing test in writing (accountability, Art. 5(2)) and state the legitimate interest in the information under Art. 13(1)(d) or Art. 14(2)(b).'
);
const OBJECTION = L(
	'Bei einem Widerspruch nach Art. 21 muss die Verarbeitung enden, es sei denn, zwingende schutzwürdige Gründe überwiegen; bei Direktwerbung endet sie immer.',
	'After an objection under Art. 21 the processing must stop unless compelling legitimate grounds override; for direct marketing it always stops.'
);
const SPECIAL = L(
	'Für Art.-9-Daten genügt Art. 6 Abs. 1 lit. f nicht: Zusätzlich ist eine Ausnahme nach Art. 9 Abs. 2 erforderlich, für Art.-10-Daten eine Grundlage nach Art. 10.',
	'For Art. 9 data, Art. 6(1)(f) alone is not enough: an exception under Art. 9(2) is also required, and for Art. 10 data a basis under Art. 10.'
);

/**
 * three cumulative steps. Steps 1 and 2 are gates; step 3 weighs the
 * circumstances against each other. The result is an estimate, labelled as
 * such, never an automatic legal conclusion.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;
	const no = (id: string) => answers[id] === 'no';
	const yes = (id: string) => answers[id] === 'yes';

	if (yes('x_authority')) {
		return {
			verdict: 'positive',
			headline: L('Art. 6 Abs. 1 lit. f ist nicht anwendbar.', 'Art. 6(1)(f) is not available.'),
			explanation: L(
				'Behörden können sich bei der Erfüllung ihrer Aufgaben nicht auf berechtigte Interessen stützen. Prüfen Sie Art. 6 Abs. 1 lit. c oder e mit einer gesetzlichen Grundlage.',
				'Public authorities cannot rely on legitimate interests in the performance of their tasks. Check Art. 6(1)(c) or (e) with a statutory basis.'
			),
			reasons: [reasonFor(catalog, 'x_authority')],
			citations
		};
	}

	const failedInterest = INTEREST.filter(no);
	if (failedInterest.length > 0) {
		return {
			verdict: 'positive',
			headline: L('Kein berechtigtes Interesse dargelegt.', 'No legitimate interest established.'),
			explanation: L(
				'Das Interesse erfüllt nicht alle Anforderungen der ersten Stufe. Ohne berechtigtes Interesse scheidet Art. 6 Abs. 1 lit. f aus; eine andere Rechtsgrundlage ist nötig.',
				'The interest does not meet all requirements of the first step. Without a legitimate interest, Art. 6(1)(f) is not available; another legal basis is needed.'
			),
			reasons: failedInterest.map((id) => reasonFor(catalog, id)),
			citations
		};
	}

	const failedNecessity = NECESSITY.filter(no);
	if (failedNecessity.length > 0) {
		return {
			verdict: 'positive',
			headline: L('Verarbeitung nicht erforderlich.', 'Processing not necessary.'),
			explanation: L(
				'Die Verarbeitung ist für das Interesse nicht erforderlich. Prüfen Sie das mildere Mittel oder beschränken Sie Daten und Personenkreis; danach kann die Abwägung neu erfolgen.',
				'The processing is not necessary for the interest. Consider the less intrusive means or limit the data and persons involved; then repeat the assessment.'
			),
			reasons: failedNecessity.map((id) => reasonFor(catalog, id)),
			citations
		};
	}

	const gateOpen = [...INTEREST, ...NECESSITY, 'x_authority']
		.filter((id) => answers[id] === 'unknown')
		.map((id) => reasonFor(catalog, id));

	let against = 0;
	const againstReasons: Reason[] = [];
	for (const [id, weight] of Object.entries(AGAINST)) {
		if (yes(id)) {
			against += weight;
			againstReasons.push(reasonFor(catalog, id));
		}
	}
	if (no('f_expected')) {
		against += 1;
		againstReasons.push(reasonFor(catalog, 'f_expected'));
	}
	const forCount = FOR.filter(yes).length;
	const notes = [DOCUMENT, OBJECTION, ...(yes('a_special') ? [SPECIAL] : [])];

	if (gateOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Prüfung unvollständig.', 'Assessment incomplete.'),
			explanation: L(
				'Die ersten beiden Stufen sind nicht vollständig geklärt. Erst wenn Interesse und Erforderlichkeit feststehen, trägt die Abwägung.',
				'The first two steps are not fully settled. The balancing only holds once interest and necessity are established.'
			),
			reasons: gateOpen,
			notes,
			citations
		};
	}

	if (against === 0) {
		return {
			verdict: 'negative',
			headline: L('Interessenabwägung trägt voraussichtlich.', 'Legitimate interest likely holds.'),
			explanation: L(
				`Interesse und Erforderlichkeit liegen vor, und keiner der geprüften Umstände spricht gegen die Verarbeitung (${forCount} sprechen dafür). Art. 6 Abs. 1 lit. f kommt als Rechtsgrundlage in Betracht.`,
				`Interest and necessity are established, and none of the checked circumstances weighs against the processing (${forCount} weigh in favour). Art. 6(1)(f) is a plausible legal basis.`
			),
			reasons: [],
			notes,
			citations
		};
	}

	if (forCount > against && !yes('a_children') && !yes('a_special')) {
		return {
			verdict: 'conditional',
			headline: L(
				'Abwägung knapp – mit Schutzmaßnahmen vertretbar.',
				'Close call – defensible with safeguards.'
			),
			explanation: L(
				`Umstände gegen die Verarbeitung (Gewicht ${against}) stehen solchen dafür gegenüber (${forCount}). Die Abwägung kann zugunsten des Verantwortlichen ausgehen, wenn die Schutzmaßnahmen tatsächlich umgesetzt und begründet dokumentiert werden.`,
				`Circumstances against the processing (weight ${against}) face circumstances in favour (${forCount}). The balance can favour the controller if the safeguards are actually implemented and documented with reasons.`
			),
			reasons: againstReasons,
			notes,
			citations
		};
	}

	return {
		verdict: 'positive',
		headline: L(
			'Interessen der Betroffenen überwiegen voraussichtlich.',
			"Data subjects' interests likely override."
		),
		explanation: L(
			`Die Umstände gegen die Verarbeitung (Gewicht ${against}) überwiegen die Umstände dafür (${forCount})` +
				(yes('a_children') ? ', zumal Kinder betroffen sind' : '') +
				'. Stützen Sie die Verarbeitung auf eine andere Rechtsgrundlage, etwa eine Einwilligung, oder verringern Sie den Eingriff und prüfen Sie erneut.',
			`The circumstances against the processing (weight ${against}) outweigh those in favour (${forCount})` +
				(yes('a_children') ? ', particularly as children are affected' : '') +
				'. Base the processing on another legal basis such as consent, or reduce the intrusion and assess again.'
		),
		reasons: againstReasons,
		notes,
		citations
	};
}
