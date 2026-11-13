import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, EDPB_MODELS, definition, dpiaNeeded } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the planned training start while in concept, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = record.data.training_ab;
	if (typeof start === 'string' && start && record.state === 'konzept') {
		specs.push({
			kind: 'training',
			label: L(
				'Training beginnt: Rechtsgrundlage und Information bereit',
				'Training starts: legal basis and information ready'
			),
			dueAt: dayAt(start),
			cite: { law: 'DSGVO', ref: 'Art. 6, 13, 14' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/**
 * the state of the model: gaps, a balancing test that fails and a required
 * DPIA that is missing are reasons; open points and checks not yet run keep
 * it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [{ law: 'KI-VO', ref: 'Art. 3 Nr. 3, Art. 25' }];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (inScope(data, ['personenbezug'])) {
		citations.unshift({ law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f, Art. 35' }, EDPB_MODELS);
		const balance = snapshot(data, 'abwaegung');
		if (!balance || balance.verdict === 'conditional') {
			pending.push(L('Interessenabwägung', 'legitimate-interest assessment'));
		} else if (balance.verdict === 'positive') {
			reasons.unshift({
				questionId: 'abwaegung',
				text: L(
					`Interessenabwägung: ${balance.headline.de} Dann eine andere Rechtsgrundlage, etwa eine Einwilligung, oder keine personenbezogenen Daten.`,
					`Legitimate-interest assessment: ${balance.headline.en} Then another legal basis, such as consent, or no personal data.`
				),
				cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f' }
			});
		}
		if (!snapshot(data, 'dsfa_check')) {
			pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
		}
		if (dpiaNeeded(data) && isEmpty(data.dsfa)) {
			reasons.push({
				questionId: 'dsfa',
				text: L(
					'Die Schwellwertanalyse verlangt eine Datenschutz-Folgenabschätzung; sie ist noch nicht verknüpft.',
					'The screening requires a data protection impact assessment; none is linked yet.'
				),
				cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
			});
		}
	} else {
		notes.push(
			L(
				'Ohne personenbezogene Daten gilt die DSGVO nicht. Prüfen, ob das wirklich so ist: Namen in Texten, Gesichter in Bildern und Kennungen in Protokollen zählen mit.',
				'Without personal data the GDPR does not apply. Check that this really holds: names in texts, faces in images and identifiers in logs count too.'
			)
		);
	}
	if (inScope(data, ['allgemein'])) citations.push({ law: 'KI-VO', ref: 'Art. 53' });

	const open = openNote(state.open);
	if (open) notes.push(open);
	if (pending.length > 0) {
		notes.push(
			L(
				`Noch durchzuführen: ${pending.map((p) => p.de).join(', ')}.`,
				`Still to run: ${pending.map((p) => p.en).join(', ')}.`
			)
		);
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Handlungsbedarf vor der Freigabe.', 'Action needed before the release.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt. ${figures.de}`,
				`The points below are not met. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (state.open.length > 0 || pending.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Vorbereitung läuft.', 'Preparation in progress.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist erledigt. ${figures.de}`,
				`No gap so far, but not everything is done. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erledigt',
		headline: L('Alles erledigt.', 'All done.'),
		explanation: L(
			`Alle Punkte sind erledigt. ${figures.de}`,
			`Every point is done. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
