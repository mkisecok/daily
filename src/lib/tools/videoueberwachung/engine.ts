import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, DSK_VIDEO, definition, dpiaNeeded } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the planned start while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'inbetrieb_ab');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'inbetrieb',
			label: L('Kameras gehen in Betrieb: Freigabe nötig', 'Cameras go live: approval needed'),
			dueAt: dayAt(start),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Videoüberwachung: Erforderlichkeit prüfen', 'Video surveillance: check necessity'),
			dueAt: dayAt(review),
			cite: DSK_VIDEO
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/**
 * the state of the set-up: gaps, a balancing test that fails and a required
 * DPIA are reasons; open points and checks not yet run keep it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f, Art. 13' },
		DSK_VIDEO
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	const balance = snapshot(data, 'abwaegung');
	if (!balance || balance.verdict === 'conditional') {
		pending.push(L('Interessenabwägung', 'legitimate-interest assessment'));
	} else if (balance.verdict === 'positive') {
		reasons.unshift({
			questionId: 'abwaegung',
			text: L(
				`Interessenabwägung: ${balance.headline.de}`,
				`Legitimate-interest assessment: ${balance.headline.en}`
			),
			cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f' }
		});
	}
	if (!snapshot(data, 'dsfa_check')) pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
	if (dpiaNeeded(data)) {
		citations.push({ law: 'DSGVO', ref: 'Art. 35 Abs. 3 lit. c' });
		if (isEmpty(data.dsfa)) {
			reasons.push({
				questionId: 'dsfa',
				text: L(
					'Die Schwellwertanalyse verlangt eine Datenschutz-Folgenabschätzung; sie ist noch nicht verknüpft.',
					'The screening requires a data protection impact assessment; none is linked yet.'
				),
				cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
			});
		}
	}

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
	if (isEmpty(data.umfang)) {
		notes.push(
			L(
				'Kein Umfang angegeben: Die Checkliste gilt so für Kameras, die nur live zeigen. Speicherung, Fernzugriff und Beschäftigte kommen hinzu, sobald sie angekreuzt sind.',
				'No scope given: the checklist then fits cameras that only show a live image. Storage, remote access and staff are added once ticked.'
			)
		);
	}
	if (inScope(data, ['fernzugriff']) && isEmpty(data.avv)) {
		notes.push(L('Die AVV-Prüfung verknüpfen.', 'Link the processing agreement check.'));
	}
	if (isEmpty(data.vvt)) {
		notes.push(L('Den Eintrag im VVT verknüpfen.', 'Link the record of processing entry.'));
	}
	if (inScope(data, ['beschaeftigte'])) {
		notes.push(
			L(
				'Verdeckte Überwachung von Beschäftigten ist nur bei konkretem Verdacht einer Straftat denkbar und nicht Gegenstand dieser Checkliste.',
				'Covert surveillance of staff is conceivable only on concrete suspicion of a crime and is not covered by this checklist.'
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
			headline: L('Noch nicht freigabefähig.', 'Not ready for approval.'),
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
			headline: L('Prüfung läuft.', 'Review in progress.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist geprüft. ${figures.de}`,
				`No gap so far, but not everything is checked. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'freigabefaehig',
		headline: L('Freigabefähig.', 'Ready for approval.'),
		explanation: L(
			`Alle Punkte sind erledigt und die nötigen Prüfungen liegen vor. Die Erforderlichkeit regelmäßig erneut prüfen. ${figures.de}`,
			`Every point is done and the checks needed are on file. Check the necessity again regularly. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
