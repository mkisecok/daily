import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, missingChecks } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the send date while under review, and gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const send = record.data.versand_am;
	if (typeof send === 'string' && send && record.state === 'pruefung') {
		specs.push({
			kind: 'versand',
			label: L('Geplanter Versand: Freigabe nötig', 'Planned send: approval needed'),
			dueAt: dayAt(send),
			cite: { law: 'UWG', ref: '§ 7' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** an attached result that says something is wrong becomes a reason */
function failed(
	data: RecordView['data'],
	field: string,
	prefix: Localized,
	cite: LegalBasis
): Reason | null {
	const result = snapshot(data, field);
	if (result?.verdict !== 'positive') return null;
	return {
		questionId: field,
		text: L(`${prefix.de}: ${result.headline.de}`, `${prefix.en}: ${result.headline.en}`),
		cite
	};
}

/** the state of the campaign: gaps and failed checks are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'UWG', ref: '§ 7' },
		{ law: 'DSGVO', ref: 'Art. 21' }
	];
	const notes: Localized[] = [];

	if (isEmpty(data.umfang)) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Kanäle fehlen.', 'Channels missing.'),
			explanation: L(
				'Erst angeben, über welche Kanäle geworben wird; danach zeigt die Checkliste, was gilt.',
				'First say which channels are used; then the checklist shows what is needed.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	if (inScope(data, ['post'])) {
		const balance = failed(data, 'abwaegung', L('Interessenabwägung', 'Legitimate interest'), {
			law: 'DSGVO',
			ref: 'Art. 6 Abs. 1 lit. f'
		});
		if (balance) reasons.push(balance);
	}
	if (inScope(data, ['drittland'])) {
		const transfer = failed(data, 'transfer_check', L('Drittlandprüfung', 'Third-country check'), {
			law: 'DSGVO',
			ref: 'Art. 44'
		});
		if (transfer) reasons.push(transfer);
	}
	if (inScope(data, ['telefon'])) citations.push({ law: 'UWG', ref: '§ 7a' });
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
	if (inScope(data, ['dienstleister', 'drittland']) && isEmpty(data.avv)) {
		notes.push(
			L(
				'Die AVV-Prüfung für den Versanddienst verknüpfen.',
				'Link the processing agreement check for the mailing service.'
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
			headline: L('Noch nicht versandbereit.', 'Not ready to send.'),
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
		outcome: 'versandbereit',
		headline: L('Versandbereit.', 'Ready to send.'),
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
