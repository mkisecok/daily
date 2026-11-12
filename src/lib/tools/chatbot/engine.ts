import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, missingChecks } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the launch while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'start_am');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'start',
			label: L('Chatbot geht online: Freigabe nötig', 'Chatbot goes live: approval needed'),
			dueAt: dayAt(start),
			cite: { law: 'KI-VO', ref: 'Art. 50 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Chatbot', 'Chatbot review'),
			dueAt: dayAt(review),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the chatbot: a prohibited practice, gaps and a transfer without a basis are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'KI-VO', ref: 'Art. 50 Abs. 1' },
		{ law: 'DSGVO', ref: 'Art. 13, 28' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);

	const classification = snapshot(data, 'einstufung');
	if (classification?.outcome === 'verboten') {
		reasons.unshift({
			questionId: 'einstufung',
			text: L(
				'Die Risikoklassifizierung ergibt eine verbotene Praxis; der Chatbot darf so nicht eingesetzt werden.',
				'The risk classification finds a prohibited practice; the chatbot must not be used this way.'
			),
			cite: { law: 'KI-VO', ref: 'Art. 5' }
		});
	} else if (classification?.outcome === 'hochrisiko') {
		notes.push(
			L(
				'Die Risikoklassifizierung ergibt Hochrisiko: zusätzlich das Werkzeug KI-Tool einführen für die Pflichten des Art. 26 nutzen.',
				'The risk classification finds high risk: also use the AI tool introduction for the Art. 26 duties.'
			)
		);
	}
	if (inScope(data, ['drittland'])) {
		const transfer = snapshot(data, 'transfer_check');
		if (transfer?.verdict === 'positive') {
			reasons.push({
				questionId: 'transfer_check',
				text: L(
					`Drittlandprüfung: ${transfer.headline.de}`,
					`Third-country check: ${transfer.headline.en}`
				),
				cite: { law: 'DSGVO', ref: 'Art. 44' }
			});
		}
	}
	const pending = missingChecks(data).map((c) => c.label);

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
		notes.push(L('Den Chatbot im KI-Register erfassen.', 'Add the chatbot to the AI register.'));
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: classification?.outcome === 'verboten' ? 'verboten' : 'luecken',
			headline: L('Noch nicht startklar.', 'Not ready to launch.'),
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
		outcome: 'startklar',
		headline: L('Startklar.', 'Ready to launch.'),
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
