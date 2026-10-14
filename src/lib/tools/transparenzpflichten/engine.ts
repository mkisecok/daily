import { count, reasonFor } from '../checklist.js';
import type {
	Answers,
	Localized,
	QuestionnaireCatalog,
	QuestionnaireResult,
	Reason
} from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** Questions whose "unclear" leaves a duty undecided. */
const DECISIVE = [
	'r_provider',
	'r_deployer',
	'a_interaction',
	'a_obvious',
	'a_synthetic',
	'a_assistive',
	'b_emotion',
	'b_deepfake',
	'b_artistic',
	'b_text',
	'b_editorial'
];

const TIMING = L(
	'Die Information muss klar und unterscheidbar sein und spätestens bei der ersten Interaktion oder Konfrontation erfolgen; sie muss barrierefrei sein (Art. 50 Abs. 5).',
	'The information must be clear and distinguishable, be given at the latest at the first interaction or exposure, and meet accessibility requirements (Art. 50(5)).'
);

/**
 * Applies Art. 50 per role. A duty arises when its trigger is "yes" and its
 * exception is not "yes"; "unclear" on a decisive question makes the result
 * conditional unless a duty is already certain.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const yes = (id: string) => answers[id] === 'yes';
	const provider = yes('r_provider');
	const deployer = yes('r_deployer');
	const reasons: Reason[] = [];
	const duties: Localized[] = [];

	if (provider) {
		if (yes('a_interaction') && !yes('a_obvious')) {
			reasons.push(reasonFor(catalog, 'a_interaction'));
			duties.push(
				L(
					'Das System so gestalten, dass betroffene Personen darüber informiert werden, dass sie mit einem KI-System interagieren (Art. 50 Abs. 1).',
					'Design the system so that persons are informed that they are interacting with an AI system (Art. 50(1)).'
				)
			);
		}
		if (yes('a_synthetic') && !yes('a_assistive')) {
			reasons.push(reasonFor(catalog, 'a_synthetic'));
			const date = yes('r_existing')
				? L('ab dem 2. Dezember 2026', 'from 2 December 2026')
				: L('seit dem 2. August 2026', 'since 2 August 2026');
			duties.push(
				L(
					`Ausgaben in maschinenlesbarem Format kennzeichnen und als künstlich erzeugt oder manipuliert erkennbar machen, soweit technisch möglich (Wasserzeichen, Metadaten, kryptografische Nachweise); Pflicht ${date.de} (Art. 50 Abs. 2).`,
					`Mark outputs in a machine-readable format and make them detectable as artificially generated or manipulated, as far as technically feasible (watermarks, metadata, cryptographic provenance); duty applies ${date.en} (Art. 50(2)).`
				)
			);
		}
	}

	if (deployer) {
		if (yes('b_emotion')) {
			reasons.push(reasonFor(catalog, 'b_emotion'));
			duties.push(
				L(
					'Die betroffenen Personen über den Betrieb des Systems informieren und die personenbezogenen Daten nach DSGVO verarbeiten (Art. 50 Abs. 3). Verbot nach Art. 5 Abs. 1 lit. f prüfen.',
					'Inform exposed persons about the operation of the system and process personal data in line with the GDPR (Art. 50(3)). Check the prohibition in Art. 5(1)(f).'
				)
			);
		}
		if (yes('b_deepfake')) {
			reasons.push(reasonFor(catalog, 'b_deepfake'));
			duties.push(
				yes('b_artistic')
					? L(
							'Offenlegen, dass der Inhalt künstlich erzeugt oder manipuliert wurde, in einer Form, die Darstellung und Genuss des Werks nicht beeinträchtigt (Art. 50 Abs. 4 UAbs. 1 S. 3).',
							'Disclose that the content has been artificially generated or manipulated, in a way that does not hamper the display or enjoyment of the work (Art. 50(4), first subparagraph).'
						)
					: L(
							'Offenlegen, dass der Inhalt künstlich erzeugt oder manipuliert wurde (Art. 50 Abs. 4 UAbs. 1).',
							'Disclose that the content has been artificially generated or manipulated (Art. 50(4), first subparagraph).'
						)
			);
		}
		if (yes('b_text') && !yes('b_editorial')) {
			reasons.push(reasonFor(catalog, 'b_text'));
			duties.push(
				L(
					'Offenlegen, dass der Text künstlich erzeugt oder manipuliert wurde (Art. 50 Abs. 4 UAbs. 2).',
					'Disclose that the text has been artificially generated or manipulated (Art. 50(4), second subparagraph).'
				)
			);
		}
	}

	const unclear = DECISIVE.filter((id) => answers[id] === 'unknown').map((id) =>
		reasonFor(catalog, id)
	);
	const citations = catalog.sources;

	if (duties.length > 0) {
		const n = count(duties.length, L('Pflicht', 'obligation'), L('Pflichten', 'obligations'));
		return {
			verdict: 'positive',
			headline: L('Transparenzpflichten bestehen.', 'Transparency obligations apply.'),
			explanation: L(
				`Ergebnis nach Art. 50 KI-VO: ${n.de}. Das gilt unabhängig davon, ob das System hochriskant ist.` +
					(unclear.length ? ` ${unclear.length} Frage(n) sind noch offen.` : ''),
				`Result under Art. 50 AI Act: ${n.en}. This applies whether or not the system is high-risk.` +
					(unclear.length ? ` ${unclear.length} question(s) remain open.` : '')
			),
			reasons,
			notes: [...duties, TIMING],
			citations
		};
	}

	if (!provider && !deployer && !unclear.length) {
		return {
			verdict: 'negative',
			headline: L('Keine Rolle nach Art. 50.', 'No role under Art. 50.'),
			explanation: L(
				'Sie sind weder Anbieter noch Betreiber des Systems. Art. 50 richtet sich nur an diese beiden Rollen; die rein persönliche Nutzung ist nicht erfasst.',
				'You are neither provider nor deployer of the system. Art. 50 addresses only these two roles; purely personal use is not covered.'
			),
			reasons: [],
			citations
		};
	}

	if (unclear.length) {
		return {
			verdict: 'conditional',
			headline: L('Offene Punkte.', 'Open points.'),
			explanation: L(
				'Nach den eindeutig beantworteten Fragen besteht keine Pflicht. Ob eine Pflicht besteht, hängt von den offenen Punkten ab.',
				'The clearly answered questions give rise to no obligation. Whether one applies depends on the open points.'
			),
			reasons: unclear,
			citations
		};
	}

	return {
		verdict: 'negative',
		headline: L(
			'Keine Transparenzpflichten nach Art. 50.',
			'No transparency obligations under Art. 50.'
		),
		explanation: L(
			'Keiner der Fälle des Art. 50 trifft zu oder eine Ausnahme greift. Andere Pflichten der KI-VO können trotzdem bestehen; die Risikoklassifizierung zeigt sie.',
			'None of the Art. 50 cases applies, or an exception does. Other AI Act obligations may still apply; the risk classification shows them.'
		),
		reasons: [],
		notes: [
			L(
				'KI-Kompetenz der Beschäftigten sicherstellen (Art. 4, seit 2. Februar 2025).',
				'Ensure AI literacy of staff (Art. 4, since 2 February 2025).'
			)
		],
		citations
	};
}
