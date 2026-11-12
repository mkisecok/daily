import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, dpiaNeeded } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the planned start while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'einsatz_ab');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'einsatz',
			label: L('Geplanter Einsatz: Freigabe nötig', 'Planned use: approval needed'),
			dueAt: dayAt(start),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Software', 'Software review'),
			dueAt: dayAt(review),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/**
 * the state of the introduction: gaps and a required DPIA are reasons; open
 * points and checks not yet run keep it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 24, 25, 32' },
		{ law: 'BSI', ref: 'IT-Grundschutz-Kompendium, Edition 2023' }
	];
	const notes: Localized[] = [];

	if (isEmpty(data.umfang)) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Umfang fehlt.', 'Scope missing.'),
			explanation: L(
				'Erst angeben, was auf die Software zutrifft; danach zeigt die Checkliste, was gilt.',
				'First say what applies to the software; then the checklist shows what is needed.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	const personal = inScope(data, ['personenbezug']);
	if (personal && !snapshot(data, 'dsfa_check')) {
		pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
	}
	if (dpiaNeeded(data)) {
		citations.push({ law: 'DSGVO', ref: 'Art. 35' });
		if (isEmpty(data.dsfa)) {
			reasons.unshift({
				questionId: 'dsfa',
				text: L(
					'Die Schwellwertanalyse verlangt eine Datenschutz-Folgenabschätzung; sie ist noch nicht verknüpft.',
					'The screening requires a data protection impact assessment; none is linked yet.'
				),
				cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
			});
		}
	}
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
	if (inScope(data, ['ki'])) {
		notes.push(
			L(
				'Die Software enthält KI-Funktionen: zusätzlich das Werkzeug KI-Tool einführen nutzen (Risikoklasse, Transparenz, KI-Kompetenz).',
				'The software contains AI functions: also use the AI tool introduction (risk class, transparency, AI literacy).'
			)
		);
	}
	if (personal && isEmpty(data.vvt)) {
		notes.push(L('Den Eintrag im VVT verknüpfen.', 'Link the record of processing entry.'));
	}
	if (inScope(data, ['cloud']) && personal && isEmpty(data.avv)) {
		notes.push(L('Die AVV-Prüfung verknüpfen.', 'Link the processing agreement check.'));
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
			`Alle Punkte sind erledigt und die nötigen Prüfungen liegen vor. Bei größeren Updates oder einem Anbieterwechsel erneut prüfen. ${figures.de}`,
			`Every point is done and the checks needed are on file. Check again after major updates or a change of provider. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
