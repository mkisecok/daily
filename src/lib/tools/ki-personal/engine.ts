import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, classOf, definition, dpiaNeeded } from './definition.js';
import { since } from '../risikoklassifizierung/engine.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the planned use while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'einsatz_ab');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'einsatz',
			label: L(
				'KI-Einsatz im Personalbereich: Freigabe nötig',
				'AI use for staff: approval needed'
			),
			dueAt: dayAt(start),
			cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 7' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage KI im Personalbereich', 'Review of AI for staff'),
			dueAt: dayAt(review),
			cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the introduction: a prohibited practice, gaps and a missing DPIA are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'KI-VO', ref: 'Anhang III Nr. 4' },
		{ law: 'DSGVO', ref: 'Art. 22, 88' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];
	const outcome = classOf(data);

	if (outcome === 'verboten') {
		reasons.unshift({
			questionId: 'einstufung',
			text: L(
				'Die Risikoklassifizierung ergibt eine verbotene Praxis; das System darf nicht eingesetzt werden.',
				'The risk classification finds a prohibited practice; the system must not be used.'
			),
			cite: { law: 'KI-VO', ref: 'Art. 5' }
		});
	}
	if (!snapshot(data, 'einstufung'))
		pending.push(L('Risikoklassifizierung', 'risk classification'));
	if (!snapshot(data, 'dsfa_check')) pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
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
	if (outcome === 'hochrisiko') {
		citations.push({ law: 'KI-VO', ref: 'Art. 26' });
		notes.push(
			L(
				`Hochrisiko-KI: Die Betreiberpflichten des Art. 26 gelten für Anhang III ${since('annexIII').de}; das Werkzeug Betreiberpflichten prüft sie im Einzelnen.`,
				`High-risk AI: the deployer duties of Art. 26 apply for Annex III ${since('annexIII').en}; the deployer duties tool checks them in detail.`
			)
		);
	} else if (outcome === 'kein-ki' || outcome === 'ausserhalb') {
		notes.push(
			L(
				'Die KI-Verordnung greift nicht; Datenschutz und Mitbestimmung gelten trotzdem.',
				'The AI Act does not apply; data protection and co-determination still do.'
			)
		);
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
	if (isEmpty(data.register)) {
		notes.push(L('Das System im KI-Register erfassen.', 'Add the system to the AI register.'));
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: outcome === 'verboten' ? 'verboten' : 'luecken',
			headline:
				outcome === 'verboten'
					? L('Einsatz nicht zulässig.', 'Use not permitted.')
					: L('Noch nicht freigabefähig.', 'Not ready for approval.'),
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
			`Alle Punkte sind erledigt und die nötigen Prüfungen liegen vor. ${figures.de}`,
			`Every point is done and the checks needed are on file. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
