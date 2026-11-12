import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, eventOf, needsConsentCheck } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

const DAY_LABEL: Record<string, Localized> = {
	eintritt: L(
		'Erster Arbeitstag: Verpflichtung, Hinweise, Zugänge',
		'First working day: commitment, notice, access'
	),
	wechsel: L('Neue Aufgabe: Berechtigungen anpassen', 'New role: adjust permissions'),
	austritt: L(
		'Letzter Arbeitstag: Zugänge sperren, Rückgabe',
		'Last working day: block access, returns'
	)
};

/** the working day while in progress, the deletion review once closed, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const event = eventOf(record.data);
	const day = str(record, 'stichtag');
	if (event && day && record.state === 'offen') {
		specs.push({
			kind: 'stichtag',
			label: DAY_LABEL[event],
			dueAt: dayAt(day),
			cite:
				event === 'eintritt'
					? { law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
					: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' }
		});
	}
	const deletion = str(record, 'loeschung_ab');
	if (deletion && record.state === 'abgeschlossen') {
		specs.push({
			kind: 'loeschung',
			label: L('Personalakte: Löschung prüfen', 'Personnel file: review deletion'),
			dueAt: dayAt(deletion),
			cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the event: gaps and a failed consent are reasons; open points keep it open */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const event = eventOf(data);
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 5, 32 Abs. 4' },
		{ law: 'BSI', ref: 'IT-Grundschutz-Kompendium, Edition 2023: ORP.2, ORP.4' }
	];
	const notes: Localized[] = [];

	if (!event) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Vorgang fehlt.', 'Event missing.'),
			explanation: L(
				'Erst angeben, ob es um Eintritt, Wechsel oder Austritt geht; danach zeigt die Checkliste, was gilt.',
				'First say whether this is joining, a change of role or leaving; then the checklist shows what is needed.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (needsConsentCheck(data)) {
		const consent = snapshot(data, 'foto_check');
		if (!consent)
			pending.push(L('Einwilligungs-Check für das Foto', 'consent check for the photo'));
		else if (consent.verdict === 'positive') {
			reasons.push({
				questionId: 'foto_check',
				text: L(
					`Einwilligung für das Foto: ${consent.headline.de}`,
					`Consent to the photo: ${consent.headline.en}`
				),
				cite: { law: 'DSGVO', ref: 'Art. 7' }
			});
		}
	}
	if (event === 'eintritt' && inScope(data, ['ki'])) {
		citations.push({ law: 'KI-VO', ref: 'Art. 4' });
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
	if (event === 'eintritt' && isEmpty(data.schulung)) {
		notes.push(L('Den Schulungsnachweis verknüpfen.', 'Link the training record.'));
	}
	if (event === 'austritt') {
		if (isEmpty(data.loeschkonzept)) {
			notes.push(
				L(
					'Die Löschregel für die Personalakte im Löschkonzept verknüpfen.',
					'Link the deletion rule for the personnel file in the deletion concept.'
				)
			);
		}
		notes.push(
			L(
				'Nach dem Austritt kommen oft Auskunftsersuchen; dafür gibt es das Werkzeug Betroffenenanfrage.',
				'Access requests often follow after leaving; the data subject request tool handles them.'
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
			headline: L('Noch nicht abschließbar.', 'Not ready to close.'),
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
			headline: L('In Bearbeitung.', 'In progress.'),
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
		outcome: 'abschliessbar',
		headline: L('Abschließbar.', 'Ready to close.'),
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
