import { gapDeadlines } from '../../records/checks.js';
import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, DSK_ASSET, dealOf, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the end of the staff's one-month objection period after they were informed */
export function objectionEnds(record: RecordView): string | null {
	const informed = str(record, 'unterrichtet_am');
	return informed && inScope(record.data, ['beschaeftigte']) ? dateAfterMonths(informed, 1) : null;
}

/** the closing date and the objection period until done, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const running = record.state === 'verhandlung' || record.state === 'vollzug';
	const closing = str(record, 'vollzug_am');
	if (closing && running) {
		specs.push({
			kind: 'vollzug',
			label: L(
				'Vollzug: Daten nach den Fallgruppen übergeben',
				'Closing: hand over data by case group'
			),
			dueAt: dayAt(closing),
			cite: DSK_ASSET
		});
	}
	const objection = objectionEnds(record);
	if (objection && running) {
		specs.push({
			kind: 'widerspruch',
			label: L('Ende der Widerspruchsfrist der Beschäftigten', 'End of the staff objection period'),
			dueAt: dayAt(objection),
			cite: { law: 'BGB', ref: '§ 613a Abs. 6' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the transaction: gaps and a transfer without a basis are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const deal = dealOf(data);
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 5, 6' }];
	const notes: Localized[] = [];

	if (!deal) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Art des Geschäfts fehlt.', 'Deal type missing.'),
			explanation: L(
				'Erst angeben, ob es ein Asset Deal, Share Deal oder eine Umwandlung ist; danach zeigt die Checkliste, was gilt.',
				'First say whether it is an asset deal, share deal or conversion; then the checklist shows what is needed.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	if (deal === 'asset') citations.push(DSK_ASSET);
	if (inScope(data, ['beschaeftigte'])) citations.push({ law: 'BGB', ref: '§ 613a' });

	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];
	if (inScope(data, ['drittland'])) {
		const transfer = snapshot(data, 'transfer_check');
		if (!transfer) pending.push(L('Drittlandprüfung', 'third-country check'));
		else if (transfer.verdict === 'positive') {
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
	const objection = objectionEnds(record);
	if (objection) {
		notes.push(
			L(
				`Widerspruchsfrist der Beschäftigten endet am ${objection.split('-').reverse().join('.')}; vorher keine Personalakten übergeben.`,
				`The staff objection period ends on ${objection}; hand over no personnel files before then.`
			)
		);
	} else if (inScope(data, ['beschaeftigte'])) {
		notes.push(
			L(
				'Das Datum der Unterrichtung eintragen, dann berechnet Daily das Ende der Widerspruchsfrist.',
				'Enter the date staff were informed and Daily works out the end of the objection period.'
			)
		);
	}
	if (isEmpty(data.vvt)) {
		notes.push(
			L(
				'Den betroffenen Eintrag im VVT verknüpfen.',
				'Link the record of processing entry concerned.'
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
			headline: L('Handlungsbedarf in der Transaktion.', 'Action needed in the transaction.'),
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
			headline: L('Transaktion läuft.', 'Transaction in progress.'),
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
