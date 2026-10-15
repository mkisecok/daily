import { addHours } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** Art. 33(1): "where feasible, not later than 72 hours after having become aware" */
export const NOTIFY_HOURS = 72;

const str = (record: RecordView, field: string) => {
	const value = record.data[field];
	return typeof value === 'string' && value !== '' ? value : null;
};

const listHas = (record: RecordView, field: string, ...values: string[]) => {
	const list = record.data[field];
	return Array.isArray(list) && values.some((v) => list.includes(v));
};

/** when the notification is due: awareness + 72 hours, in absolute time */
export function notificationDue(record: RecordView): string | null {
	const aware = str(record, 'kenntnis');
	return aware ? addHours(aware, NOTIFY_HOURS) : null;
}

/**
 * open deadlines. The authority clock runs until the risk is assessed as
 * "none" or the notification is entered; an unassessed breach counts as
 * notifiable. A high risk adds the communication to data subjects, which
 * Art. 34 wants "without undue delay"; Daily uses the same 72 hours as an
 * internal target.
 */
function deadlines(record: RecordView): DeadlineSpec[] {
	const due = notificationDue(record);
	if (!due) return [];
	const specs: DeadlineSpec[] = [];
	const risk = str(record, 'risiko');
	if (risk !== 'kein' && !str(record, 'gemeldet_am') && record.state !== 'nicht_meldepflichtig') {
		specs.push({
			kind: 'meldung-aufsicht',
			label: L('Meldung an die Aufsichtsbehörde', 'Notify the supervisory authority'),
			dueAt: due,
			cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1' }
		});
	}
	if (risk === 'hoch' && !str(record, 'benachrichtigt_am') && !str(record, 'ausnahme')) {
		specs.push({
			kind: 'benachrichtigung',
			label: L(
				'Benachrichtigung der Betroffenen (unverzüglich; interne Zielmarke)',
				'Communicate to data subjects (without undue delay; internal target)'
			),
			dueAt: due,
			cite: { law: 'DSGVO', ref: 'Art. 34 Abs. 1' }
		});
	}
	return specs;
}

const CONTENTS = L(
	'Inhalt der Meldung (Art. 33 Abs. 3): Art der Verletzung mit Kategorien und ungefährer Zahl der Betroffenen und Datensätze, Kontakt des Datenschutzbeauftragten, wahrscheinliche Folgen, ergriffene und vorgeschlagene Maßnahmen. Was noch nicht feststeht, kann schrittweise nachgereicht werden (Art. 33 Abs. 4).',
	'Contents of the notification (Art. 33(3)): nature of the breach with categories and approximate numbers of data subjects and records, contact of the data protection officer, likely consequences, measures taken and proposed. What is not yet known may be provided in phases (Art. 33(4)).'
);

const AUTHORITY = L(
	'Zuständig ist in der Regel die Aufsichtsbehörde des Landes, in dem die Stelle ihren Sitz hat (§ 40 BDSG); für öffentliche Stellen des Bundes und Anbieter von Telekommunikationsdiensten der BfDI. Bei grenzüberschreitender Verarbeitung die federführende Behörde (Art. 56 DSGVO).',
	'Competent is usually the authority of the federal state where the body has its seat (§ 40 BDSG); for federal public bodies and telecommunications providers the BfDI. For cross-border processing the lead authority (Art. 56 GDPR).'
);

/**
 * what the record means legally: notification duty, communication duty,
 * late notification and the documentation every breach needs.
 */
function assess(record: RecordView): QuestionnaireResult {
	const risk = str(record, 'risiko');
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 33' },
		{ law: 'DSGVO', ref: 'Art. 34' },
		{ law: 'EDPB', ref: 'Leitlinien 9/2022' }
	];

	if (record.data.auftragsverarbeiter === true) {
		notes.push(
			L(
				'Aufgetreten beim Auftragsverarbeiter: Dieser muss den Verantwortlichen unverzüglich informieren (Art. 33 Abs. 2). Die 72 Stunden laufen ab Kenntnis des Verantwortlichen.',
				'Occurred at a processor: the processor must inform the controller without undue delay (Art. 33(2)). The 72 hours run from the controller’s awareness.'
			)
		);
	}
	if (listHas(record, 'datenkategorien', 'zugang', 'finanz', 'ausweis', 'art9', 'art10')) {
		notes.push(
			L(
				'Zugangs-, Finanz- und Ausweisdaten sowie besondere Kategorien sprechen nach den EDPB-Leitlinien regelmäßig für ein hohes Risiko.',
				'According to the EDPB guidelines, credentials, financial and ID data and special categories usually indicate a high risk.'
			)
		);
	}

	const aware = str(record, 'kenntnis');
	const reported = str(record, 'gemeldet_am');
	const late =
		aware !== null &&
		reported !== null &&
		Date.parse(reported) - Date.parse(aware) > NOTIFY_HOURS * 60 * 60 * 1000;
	if (late && !str(record, 'verzoegerung')) {
		notes.push(
			L(
				'Die Meldung erfolgte nach mehr als 72 Stunden: Die Gründe für die Verzögerung sind anzugeben (Art. 33 Abs. 1 Satz 2).',
				'The notification was made after more than 72 hours: the reasons for the delay must be given (Art. 33(1), second sentence).'
			)
		);
	}

	if (risk === null) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Risiko noch nicht bewertet.', 'Risk not yet assessed.'),
			explanation: L(
				'Bis zur Bewertung ist von einer Meldepflicht auszugehen; die Frist läuft ab Kenntnis. Die Bewertung richtet sich nach Schwere und Eintrittswahrscheinlichkeit der Folgen für die Betroffenen.',
				'Until assessed, assume a notification duty; the period runs from awareness. The assessment depends on the severity and likelihood of the consequences for data subjects.'
			),
			reasons: [],
			notes: [...notes, CONTENTS],
			citations
		};
	}

	if (risk === 'kein') {
		return {
			verdict: 'negative',
			outcome: 'keine-meldung',
			headline: L('Voraussichtlich keine Meldepflicht.', 'Notification likely not required.'),
			explanation: L(
				'Führt die Verletzung voraussichtlich nicht zu einem Risiko für die Rechte und Freiheiten natürlicher Personen, entfällt die Meldung (Art. 33 Abs. 1). Die Verletzung und die Gründe der Bewertung sind dennoch zu dokumentieren (Art. 33 Abs. 5).',
				'Where the breach is unlikely to result in a risk to the rights and freedoms of natural persons, no notification is required (Art. 33(1)). The breach and the reasons for the assessment must still be documented (Art. 33(5)).'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const exception = str(record, 'ausnahme');
	if (risk === 'hoch') {
		if (exception) {
			notes.push(
				L(
					'Die Benachrichtigung entfällt nach der eingetragenen Ausnahme des Art. 34 Abs. 3; die Gründe dokumentieren. Die Aufsichtsbehörde kann die Benachrichtigung dennoch verlangen (Art. 34 Abs. 4).',
					'Communication is not required under the Art. 34(3) exception entered; document the reasons. The authority may still require it (Art. 34(4)).'
				)
			);
		} else {
			notes.push(
				L(
					'Benachrichtigung der Betroffenen in klarer und einfacher Sprache: Art der Verletzung, Kontakt des Datenschutzbeauftragten, wahrscheinliche Folgen und Maßnahmen (Art. 34 Abs. 2).',
					'Communication to data subjects in clear and plain language: nature of the breach, DPO contact, likely consequences and measures (Art. 34(2)).'
				)
			);
			if (record.data.verschluesselt === true) {
				notes.push(
					L(
						'Die Daten waren unzugänglich: Die Ausnahme nach Art. 34 Abs. 3 lit. a kommt in Betracht.',
						'The data was unintelligible: the Art. 34(3)(a) exception may apply.'
					)
				);
			}
		}
	}
	notes.push(CONTENTS, AUTHORITY);

	return risk === 'hoch'
		? {
				verdict: 'positive',
				outcome: 'meldung-benachrichtigung',
				headline: L(
					'Meldung an die Aufsicht und Benachrichtigung der Betroffenen.',
					'Notify the authority and communicate to data subjects.'
				),
				explanation: L(
					'Die Verletzung führt voraussichtlich zu einem hohen Risiko: Meldung an die Aufsichtsbehörde binnen 72 Stunden nach Kenntnis (Art. 33 Abs. 1) und unverzügliche Benachrichtigung der Betroffenen (Art. 34 Abs. 1), sofern keine Ausnahme nach Art. 34 Abs. 3 greift.',
					'The breach is likely to result in a high risk: notify the supervisory authority within 72 hours of awareness (Art. 33(1)) and communicate to data subjects without undue delay (Art. 34(1)) unless an Art. 34(3) exception applies.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'positive',
				outcome: 'meldung',
				headline: L('Meldepflichtig an die Aufsichtsbehörde.', 'Notify the supervisory authority.'),
				explanation: L(
					'Die Verletzung führt voraussichtlich zu einem Risiko: Meldung an die zuständige Aufsichtsbehörde unverzüglich und möglichst binnen 72 Stunden nach Kenntnis (Art. 33 Abs. 1). Eine Benachrichtigung der Betroffenen ist erst bei hohem Risiko erforderlich.',
					'The breach is likely to result in a risk: notify the competent supervisory authority without undue delay and, where feasible, within 72 hours of awareness (Art. 33(1)). Data subjects need to be informed only in case of a high risk.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
