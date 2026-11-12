import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, riskOutcome } from './definition.js';

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
			cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage KI-Tool', 'AI tool review'),
			dueAt: dayAt(review)
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/**
 * the state of the introduction: a prohibited practice ends it; gaps and a
 * required DPIA are reasons; open points and checks not yet run keep it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'KI-VO', ref: 'Art. 4, 26, 50' },
		{ law: 'DSGVO', ref: 'Art. 5, 6, 22' }
	];
	const notes: Localized[] = [];

	if (riskOutcome(data) === 'verboten') {
		return {
			verdict: 'positive',
			outcome: 'verboten',
			headline: L('Darf nicht eingesetzt werden.', 'Must not be used.'),
			explanation: L(
				'Die Risikoklassifizierung ergibt eine verbotene Praktik nach Art. 5 KI-VO. Das Inverkehrbringen, die Inbetriebnahme und die Verwendung sind untersagt.',
				'The risk classification finds a prohibited practice under Art. 5 AI Act. Placing on the market, putting into service and use are prohibited.'
			),
			reasons: [
				{
					questionId: 'einstufung',
					text: L('Verbotene Praktik', 'Prohibited practice'),
					cite: { law: 'KI-VO', ref: 'Art. 5 Abs. 1' }
				}
			],
			notes,
			citations
		};
	}

	if (isEmpty(data.umfang)) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Umfang fehlt.', 'Scope missing.'),
			explanation: L(
				'Erst angeben, was auf das KI-Tool zutrifft; danach zeigt die Checkliste, was gilt.',
				'First say what applies to the AI tool; then the checklist shows what is needed.'
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
	const outcome = riskOutcome(data);

	if (!outcome) pending.push(L('Risikoklassifizierung', 'risk classification'));
	if (outcome === 'hochrisiko') {
		notes.push(
			L(
				'Hochrisiko-KI-System: die Punkte unter „Hochrisiko-KI“ gelten; die Pflichten greifen ab dem 2. Dezember 2027 (Verordnung (EU) 2026/1744).',
				'High-risk AI system: the points under "High-risk AI" apply; the duties take effect from 2 December 2027 (Regulation (EU) 2026/1744).'
			)
		);
		citations.push({ law: 'KI-VO', ref: 'Art. 26, 27' });
	}
	if (outcome === 'kein-ki' || outcome === 'ausserhalb') {
		notes.push(
			L(
				'Kein KI-System im Sinne der KI-Verordnung oder außerhalb ihres Anwendungsbereichs: für die Einführung genügt das Werkzeug Neue Software einführen.',
				'Not an AI system under the AI Act, or outside its scope: the software introduction tool is enough.'
			)
		);
	}
	if (personal) {
		if (!snapshot(data, 'dsfa_check')) pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
		if (!snapshot(data, 'ki_dsgvo')) pending.push(L('KI und DSGVO', 'AI and GDPR'));
	}
	if (snapshot(data, 'dsfa_check')?.verdict === 'positive') {
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
	if (isEmpty(data.ki_register)) {
		notes.push(L('Den Eintrag im KI-Register verknüpfen.', 'Link the AI register entry.'));
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
			`Alle Punkte sind erledigt und die nötigen Prüfungen liegen vor. Nach neuen Funktionen oder Modellen erneut prüfen. ${figures.de}`,
			`Every point is done and the checks needed are on file. Check again after new features or models. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
