import { formatShortDate } from '../../i18n/date.js';
import { monthsAfterDay } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition, RIGHTS } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, field: string) => {
	const value = record.data[field];
	return typeof value === 'string' && value !== '' ? value : null;
};

/**
 * When the reply is due: one month after the day of receipt, three months
 * once an extension has been communicated (Art. 12(3)). An extension that
 * was decided but not yet communicated does not move the deadline.
 */
export function replyDue(record: RecordView): string | null {
	const received = str(record, 'eingang');
	if (!received) return null;
	const extended = record.data.verlaengerung === true && str(record, 'verlaengerung_mitgeteilt_am');
	return monthsAfterDay(received, extended ? 3 : 1);
}

function deadlines(record: RecordView): DeadlineSpec[] {
	const received = str(record, 'eingang');
	const due = replyDue(record);
	if (!received || !due || str(record, 'antwort_am')) return [];
	const specs: DeadlineSpec[] = [
		{
			kind: 'antwort',
			label: L('Antwort an die betroffene Person', 'Reply to the data subject'),
			dueAt: due,
			cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3' }
		}
	];
	if (record.data.verlaengerung === true && !str(record, 'verlaengerung_mitgeteilt_am')) {
		specs.push({
			kind: 'verlaengerung',
			label: L('Verlängerung mit Gründen mitteilen', 'Communicate the extension with reasons'),
			dueAt: monthsAfterDay(received, 1),
			cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3 Satz 3' }
		});
	}
	return specs;
}

/** What each right requires: the checklist shown on the record. */
const CHECKLIST: Record<(typeof RIGHTS)[number], Localized> = {
	auskunft: L(
		'Auskunft (Art. 15): Bestätigung, ob Daten verarbeitet werden; Zwecke, Kategorien, Empfänger, Speicherdauer, Rechte, Herkunft und automatisierte Entscheidungen (Abs. 1 lit. a–h), Garantien bei Drittlandübermittlung (Abs. 2) und eine Kopie der Daten (Abs. 3); Rechte Dritter wahren (Abs. 4).',
		'Access (Art. 15): confirmation whether data is processed; purposes, categories, recipients, storage period, rights, source and automated decisions (para. 1 (a)–(h)), safeguards for third-country transfers (para. 2) and a copy of the data (para. 3); respect the rights of others (para. 4).'
	),
	berichtigung: L(
		'Berichtigung (Art. 16): unrichtige Daten unverzüglich berichtigen, unvollständige vervollständigen; Empfänger informieren (Art. 19).',
		'Rectification (Art. 16): correct inaccurate data without undue delay, complete incomplete data; inform recipients (Art. 19).'
	),
	loeschung: L(
		'Löschung (Art. 17): Löschgrund nach Abs. 1 prüfen, Ausnahmen nach Abs. 3 (z. B. Aufbewahrungspflichten) und § 35 BDSG beachten; veröffentlichte Daten: andere Verantwortliche informieren (Abs. 2); Empfänger informieren (Art. 19).',
		'Erasure (Art. 17): check the ground under para. 1, observe the exceptions in para. 3 (e.g. retention duties) and § 35 BDSG; published data: inform other controllers (para. 2); inform recipients (Art. 19).'
	),
	einschraenkung: L(
		'Einschränkung (Art. 18): Daten markieren und außer zur Speicherung nur noch in den Fällen des Abs. 2 verarbeiten; vor Aufhebung unterrichten (Abs. 3); Empfänger informieren (Art. 19).',
		'Restriction (Art. 18): mark the data and, apart from storage, process it only in the cases of para. 2; inform before lifting (para. 3); inform recipients (Art. 19).'
	),
	uebertragbarkeit: L(
		'Datenübertragbarkeit (Art. 20): nur bereitgestellte Daten, die auf Einwilligung oder Vertrag beruhen und automatisiert verarbeitet werden; strukturiertes, gängiges, maschinenlesbares Format; auf Wunsch direkt an einen anderen Verantwortlichen, soweit technisch machbar.',
		'Data portability (Art. 20): only data provided by the person, based on consent or contract and processed by automated means; structured, commonly used, machine-readable format; directly to another controller on request where technically feasible.'
	),
	widerspruch: L(
		'Widerspruch (Art. 21): Verarbeitung nach Art. 6 Abs. 1 lit. e oder f nur bei zwingenden schutzwürdigen Gründen fortsetzen (Abs. 1); Direktwerbung ausnahmslos beenden (Abs. 2, 3).',
		'Objection (Art. 21): continue processing under Art. 6(1)(e) or (f) only on compelling legitimate grounds (para. 1); stop direct marketing without exception (paras. 2, 3).'
	),
	art22: L(
		'Automatisierte Entscheidung (Art. 22): Eingreifen einer Person, Darlegung des eigenen Standpunkts und Anfechtung der Entscheidung ermöglichen (Abs. 3).',
		'Automated decision (Art. 22): allow human intervention, expression of the person’s point of view and contesting the decision (para. 3).'
	),
	widerruf: L(
		'Widerruf (Art. 7 Abs. 3): Verarbeitung auf Grundlage der Einwilligung für die Zukunft beenden; die Rechtmäßigkeit bis zum Widerruf bleibt unberührt.',
		'Withdrawal (Art. 7(3)): stop processing based on the consent for the future; lawfulness until withdrawal is unaffected.'
	)
};

/**
 * The reply deadline as the headline, then the checklist for the rights
 * invoked and the points the record raises: identity, extension, refusal,
 * a late reply.
 */
function assess(record: RecordView): QuestionnaireResult {
	const due = replyDue(record);
	const replied = str(record, 'antwort_am');
	const rights = Array.isArray(record.data.rechte) ? record.data.rechte : [];
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 12' },
		{ law: 'EDPB', ref: 'Leitlinien 01/2022' }
	];
	const notes: Localized[] = RIGHTS.filter((right) => rights.includes(right)).map(
		(right) => CHECKLIST[right]
	);

	notes.push(
		L(
			'Die Antwort ist unentgeltlich (Art. 12 Abs. 5); elektronisch gestellte Anträge möglichst elektronisch beantworten (Art. 12 Abs. 3 Satz 4).',
			'The reply is free of charge (Art. 12(5)); answer electronic requests electronically where possible (Art. 12(3), fourth sentence).'
		)
	);
	if (record.data.identitaet === 'angefordert') {
		notes.push(
			L(
				'Ob die Frist bis zum Eingang des Identitätsnachweises gehemmt ist, ist nicht abschließend geklärt; Daily rechnet vorsichtig ab Eingang des Antrags.',
				'Whether the period is suspended until proof of identity arrives is not settled; Daily counts cautiously from receipt of the request.'
			)
		);
	}
	if (record.data.verlaengerung === true && isEmpty(record.data.verlaengerung_grund)) {
		notes.push(
			L(
				'Für die Verlängerung sind Gründe anzugeben und der betroffenen Person innerhalb eines Monats mitzuteilen.',
				'Reasons for the extension must be given and communicated to the data subject within one month.'
			)
		);
	}
	const received = str(record, 'eingang');
	const notified = str(record, 'verlaengerung_mitgeteilt_am');
	if (received && notified && notified > monthsAfterDay(received, 1)) {
		notes.push(
			L(
				'Die Verlängerung wurde nach Ablauf der Monatsfrist mitgeteilt und verlängert die Frist daher nicht.',
				'The extension was communicated after the one-month period and therefore does not extend it.'
			)
		);
	}
	if (str(record, 'ablehnung')) {
		notes.push(
			L(
				'Bei Ablehnung: Gründe sowie Beschwerde- und Klagemöglichkeit mitteilen (Art. 12 Abs. 4). Für offenkundig unbegründete oder exzessive Anträge trägt der Verantwortliche die Nachweislast (Art. 12 Abs. 5 Satz 3).',
				'On refusal: give the reasons and the possibility to lodge a complaint and seek a judicial remedy (Art. 12(4)). The controller bears the burden of proof for manifestly unfounded or excessive requests (Art. 12(5), third sentence).'
			)
		);
	}
	if (
		rights.some((r) => r === 'berichtigung' || r === 'loeschung' || r === 'einschraenkung') &&
		record.data.empfaenger_informiert !== true
	) {
		notes.push(
			L(
				'Empfänger, denen die Daten offengelegt wurden, über die Berichtigung, Löschung oder Einschränkung informieren und dies vermerken (Art. 19).',
				'Inform recipients to whom the data was disclosed of the rectification, erasure or restriction, and record it (Art. 19).'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 19' });
	}

	if (!due) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Eingang noch nicht erfasst.', 'Receipt not yet recorded.'),
			explanation: L(
				'Ohne Eingangsdatum lässt sich die Frist nicht berechnen.',
				'Without the date of receipt the deadline cannot be calculated.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	const date = (locale: string) => formatShortDate(due, locale);
	if (replied && replied > due) {
		return {
			verdict: 'positive',
			outcome: 'verspaetet',
			headline: L('Frist überschritten.', 'Deadline missed.'),
			explanation: L(
				`Die Antwort wurde nach Ablauf der Frist am ${date('de')} versandt. Verspätete Antworten können eine Beschwerde und Maßnahmen der Aufsicht nach sich ziehen; die Gründe intern dokumentieren.`,
				`The reply was sent after the deadline of ${date('en')}. Late replies may lead to a complaint and supervisory action; document the reasons internally.`
			),
			reasons: [],
			notes,
			citations
		};
	}
	if (replied) {
		return {
			verdict: 'negative',
			outcome: 'fristgerecht',
			headline: L('Fristgerecht beantwortet.', 'Answered in time.'),
			explanation: L(
				`Die Antwort ging vor Ablauf der Frist am ${date('de')} hinaus.`,
				`The reply went out before the deadline of ${date('en')}.`
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: 'conditional',
		outcome: 'offen',
		headline: L(`Antwort fällig bis ${date('de')}.`, `Reply due by ${date('en')}.`),
		explanation: L(
			'Unverzüglich, spätestens innerhalb eines Monats nach Eingang ist über die ergriffenen Maßnahmen zu informieren; eine Verlängerung um zwei Monate ist mit Begründung innerhalb dieses Monats mitzuteilen (Art. 12 Abs. 3).',
			'Information on action taken must be provided without undue delay and at the latest within one month of receipt; an extension by two months must be communicated with reasons within that month (Art. 12(3)).'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
