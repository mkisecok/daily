import { fromBerlinInput } from '../../i18n/date.js';
import type { DeadlineSpec, RecordData, RecordEngine, RecordView } from '../../records/types.js';
import { fieldById, isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const listHas = (record: RecordView, field: string, value: string) => {
	const list = record.data[field];
	return Array.isArray(list) && list.includes(value);
};

/** The review date at 9:00 German time, unless the activity is discontinued. */
function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.wiedervorlage;
	if (typeof date !== 'string' || record.data.status === 'eingestellt') return [];
	return [
		{
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Verarbeitungstätigkeit', 'Processing activity review'),
			dueAt: fromBerlinInput(`${date}T09:00`)
		}
	];
}

/**
 * The DSFA screening sets the DSFA field: required or not. A conditional
 * result leaves the decision to the user, and a finished DSFA stays finished.
 */
function fromAssessment(
	field: string,
	result: QuestionnaireResult,
	record: RecordView
): RecordData {
	if (field !== 'dsfa_check') return {};
	if (result.verdict === 'negative') return { dsfa: 'nicht_erforderlich' };
	if (result.verdict === 'positive' && record.data.dsfa !== 'durchgefuehrt') {
		return { dsfa: 'erforderlich' };
	}
	return {};
}

/** A required Art. 30 item that is empty. */
function gap(record: RecordView, id: string, cite: string): Reason | null {
	if (!isEmpty(record.data[id])) return null;
	const field = fieldById(definition, id);
	return {
		questionId: id,
		text: field?.label ?? L(id, id),
		cite: { law: 'DSGVO', ref: cite }
	};
}

/**
 * Completeness of the entry under Art. 30(1) or (2), then the points the
 * entry raises: transfers without a basis, special categories without an
 * exception, an open DSFA, processors without contracts.
 */
function assess(record: RecordView): QuestionnaireResult {
	const processor = record.data.rolle === 'auftragsverarbeiter';
	const joint = record.data.rolle === 'gemeinsam';
	const transfer = record.data.drittland === true;

	const gaps = (
		processor
			? [
					gap(record, 'auftraggeber', 'Art. 30 Abs. 2 lit. a'),
					gap(record, 'zwecke', 'Art. 30 Abs. 2 lit. b'),
					transfer ? gap(record, 'drittland_details', 'Art. 30 Abs. 2 lit. c') : null,
					gap(record, 'tom', 'Art. 30 Abs. 2 lit. d')
				]
			: [
					gap(record, 'zwecke', 'Art. 30 Abs. 1 lit. b'),
					gap(record, 'betroffene', 'Art. 30 Abs. 1 lit. c'),
					gap(record, 'datenkategorien', 'Art. 30 Abs. 1 lit. c'),
					isEmpty(record.data.empfaenger) && isEmpty(record.data.empfaenger_details)
						? gap(record, 'empfaenger', 'Art. 30 Abs. 1 lit. d')
						: null,
					transfer ? gap(record, 'drittland_details', 'Art. 30 Abs. 1 lit. e') : null,
					gap(record, 'loeschfristen', 'Art. 30 Abs. 1 lit. f'),
					gap(record, 'tom', 'Art. 30 Abs. 1 lit. g'),
					joint ? gap(record, 'gemeinsam_mit', 'Art. 26 Abs. 1') : null
				]
	).filter((reason): reason is Reason => reason !== null);

	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 30' }];

	if (transfer && isEmpty(record.data.garantien)) {
		notes.push(
			L(
				'Für die Drittlandübermittlung ist keine Grundlage nach Art. 45 bis 49 angegeben; die Drittlandprüfung klärt sie.',
				'No basis under Art. 45 to 49 is given for the third-country transfer; the third-country transfer check establishes it.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 44' });
	}
	if (
		(listHas(record, 'datenkategorien', 'art9') || listHas(record, 'datenkategorien', 'art10')) &&
		!listHas(record, 'rechtsgrundlagen', 'art9')
	) {
		notes.push(
			L(
				'Besondere Kategorien oder Strafdaten ohne Ausnahme nach Art. 9 Abs. 2 bzw. Grundlage nach Art. 10: Rechtsgrundlage ergänzen.',
				'Special categories or criminal offence data without an Art. 9(2) exception or Art. 10 basis: add the legal basis.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 9 Abs. 2' });
	}
	if (listHas(record, 'rechtsgrundlagen', 'beschaeftigung')) {
		notes.push(
			L(
				'Seit EuGH C-34/21 ist § 26 Abs. 1 Satz 1 BDSG als eigenständige Grundlage zweifelhaft; daneben die einschlägige Grundlage nach Art. 6 Abs. 1 (meist lit. b oder c) angeben.',
				'Since CJEU C-34/21, § 26(1) first sentence BDSG is doubtful as a stand-alone basis; also state the applicable Art. 6(1) basis (usually (b) or (c)).'
			)
		);
		citations.push({ law: 'EuGH', ref: 'C-34/21' });
	}
	if (
		listHas(record, 'rechtsgrundlagen', 'einwilligung') &&
		listHas(record, 'betroffene', 'beschaeftigte')
	) {
		notes.push(
			L(
				'Einwilligungen von Beschäftigten sind nur bei echter Freiwilligkeit wirksam (§ 26 Abs. 2 BDSG, Erwägungsgrund 43).',
				'Employee consent is only valid if truly voluntary (§ 26(2) BDSG, Recital 43).'
			)
		);
	}
	if (record.data.dsfa === 'erforderlich') {
		notes.push(
			L(
				'Die DSFA ist vor Beginn der Verarbeitung durchzuführen (Art. 35 Abs. 1).',
				'The DPIA must be carried out before the processing starts (Art. 35(1)).'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 35' });
	} else if (isEmpty(record.data.dsfa) || record.data.dsfa === 'ungeprueft') {
		notes.push(
			L(
				'Ob eine DSFA nötig ist, ist noch offen: die DSFA-Schwellwertanalyse durchführen und das Ergebnis übernehmen.',
				'Whether a DPIA is needed is still open: run the DPIA screening and attach the result.'
			)
		);
	}
	if (!processor && listHas(record, 'empfaenger', 'auftragsverarbeiter')) {
		notes.push(
			L(
				'Für jeden Auftragsverarbeiter muss ein Vertrag nach Art. 28 Abs. 3 vorliegen; im Feld „Empfänger im Einzelnen“ darauf verweisen.',
				'Each processor needs a contract under Art. 28(3); refer to it under "Recipients in detail".'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 28 Abs. 3' });
	}

	if (gaps.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'unvollstaendig',
			headline: L('Eintrag unvollständig.', 'Entry incomplete.'),
			explanation: L(
				`Es fehlen ${gaps.length === 1 ? 'eine Angabe' : `${gaps.length} Angaben`} nach Art. 30 DSGVO. Löschfristen und TOM sind „wenn möglich“ anzugeben; die Aufsichtsbehörden erwarten sie in aller Regel.`,
				`${gaps.length === 1 ? 'One item' : `${gaps.length} items`} required by Art. 30 GDPR ${gaps.length === 1 ? 'is' : 'are'} missing. Erasure periods and TOMs are required "where possible"; authorities generally expect them.`
			),
			reasons: gaps,
			notes,
			citations
		};
	}
	return notes.length > 0
		? {
				verdict: 'conditional',
				outcome: 'offene-punkte',
				headline: L('Vollständig, mit offenen Punkten.', 'Complete, with open points.'),
				explanation: L(
					'Die Pflichtangaben nach Art. 30 liegen vor. Die folgenden Punkte betreffen die Rechtmäßigkeit der Verarbeitung selbst.',
					'The information required by Art. 30 is present. The points below concern the lawfulness of the processing itself.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'negative',
				outcome: 'vollstaendig',
				headline: L('Eintrag vollständig.', 'Entry complete.'),
				explanation: L(
					'Die Pflichtangaben nach Art. 30 liegen vor. Das Verzeichnis ist aktuell zu halten und bei Änderungen der Verarbeitung anzupassen.',
					'The information required by Art. 30 is present. Keep the record up to date and adjust it when the processing changes.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess, fromAssessment };
export { definition };
