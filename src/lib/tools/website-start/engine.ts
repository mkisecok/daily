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

/** the planned launch while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'start_am');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'start',
			label: L('Website geht online: Freigabe nötig', 'Website goes live: approval needed'),
			dueAt: dayAt(start),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Website', 'Website review'),
			dueAt: dayAt(review),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
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

/**
 * the state of the launch: gaps, an invalid consent and a transfer without
 * a basis are reasons; open points and checks not yet run keep it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'DDG', ref: '§ 5' },
		{ law: 'TDDDG', ref: '§ 25' },
		{ law: 'DSGVO', ref: 'Art. 13, 28, 32' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);

	if (inScope(data, ['tracking'])) {
		const consent = failed(data, 'consent_check', L('Einwilligung', 'Consent'), {
			law: 'TDDDG',
			ref: '§ 25 Abs. 1'
		});
		if (consent) reasons.push(consent);
	}
	if (inScope(data, ['drittland'])) {
		const transfer = failed(data, 'transfer_check', L('Drittlandprüfung', 'Third-country check'), {
			law: 'DSGVO',
			ref: 'Art. 44'
		});
		if (transfer) reasons.push(transfer);
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
	if (isEmpty(data.avv)) {
		notes.push(
			L(
				'Die AVV-Prüfung für den Hoster verknüpfen.',
				'Link the processing agreement check for the host.'
			)
		);
	}
	if (inScope(data, ['chatbot'])) {
		citations.push({ law: 'KI-VO', ref: 'Art. 50' });
		notes.push(
			L(
				'Der Chatbot ist ein KI-System: Einzelheiten prüft das Werkzeug Chatbot auf der Website.',
				'The chatbot is an AI system: the chatbot tool checks the details.'
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
			`Alle Punkte sind erledigt und die nötigen Prüfungen liegen vor. Bei jedem neuen Dienst erneut prüfen. ${figures.de}`,
			`Every point is done and the checks needed are on file. Check again whenever a service is added. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
