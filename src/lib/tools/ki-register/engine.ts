import { fromBerlinInput } from '../../i18n/date.js';
import type { DeadlineSpec, RecordData, RecordEngine, RecordView } from '../../records/types.js';
import { DATES, type RiskOutcome } from '../risikoklassifizierung/engine.js';
import type { LegalBasis, Localized, QuestionnaireResult, VerdictLevel } from '../types.js';
import { definition, type RiskClass } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** outcome of the risk classification → risk class of the register */
const FROM_OUTCOME: Record<RiskOutcome, RiskClass> = {
	'kein-ki': 'ausserhalb',
	ausserhalb: 'ausserhalb',
	verboten: 'verboten',
	hochrisiko: 'hochriskant',
	'art6-3': 'art6_3',
	art50: 'art50',
	minimal: 'minimal'
};

function fromAssessment(field: string, result: QuestionnaireResult): RecordData {
	if (field !== 'einstufung' || !result.outcome) return {};
	const riskClass = FROM_OUTCOME[result.outcome as RiskOutcome];
	return riskClass ? { risikoklasse: riskClass } : {};
}

/** the review date at 9:00 German time, unless the system is retired */
function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.wiedervorlage;
	if (typeof date !== 'string' || record.data.status === 'ausser_betrieb') return [];
	return [
		{
			kind: 'wiedervorlage',
			label: L('Wiedervorlage KI-System', 'AI system review'),
			dueAt: fromBerlinInput(`${date}T09:00`)
		}
	];
}

type Summary = { verdict: VerdictLevel; headline: Localized; explanation: Localized };

const SUMMARY: Record<RiskClass, Summary> = {
	verboten: {
		verdict: 'positive',
		headline: L('Verbotene Praxis: Einsatz einstellen.', 'Prohibited practice: stop the use.'),
		explanation: L(
			`Praktiken nach Art. 5 KI-VO sind seit dem ${DATES.prohibited.de} untersagt. Der Einsatz ist einzustellen oder so zu ändern, dass kein Tatbestand mehr erfüllt ist.`,
			`Practices under Art. 5 AI Act have been prohibited since ${DATES.prohibited.en}. Stop the use or change it so that no element is met any longer.`
		)
	},
	hochriskant: {
		verdict: 'positive',
		headline: L('Hochrisiko-KI-System.', 'High-risk AI system.'),
		explanation: L(
			`Die Pflichten für Hochrisiko-Systeme gelten ab dem ${DATES.annexIII.de} (Anhang III) bzw. ${DATES.annexI.de} (Anhang I) (${DATES.source}).`,
			`High-risk obligations apply from ${DATES.annexIII.en} (Annex III) or ${DATES.annexI.en} (Annex I) (${DATES.source}).`
		)
	},
	art6_3: {
		verdict: 'conditional',
		headline: L('Nicht hochriskant nach Art. 6 Abs. 3.', 'Not high-risk under Art. 6(3).'),
		explanation: L(
			'Das System fällt in einen Bereich des Anhangs III, gilt aber wegen einer eng begrenzten Aufgabe nicht als hochriskant. Die Bewertung ist zu dokumentieren.',
			'The system falls within an Annex III area but is not considered high-risk because of a narrow task. The assessment must be documented.'
		)
	},
	art50: {
		verdict: 'conditional',
		headline: L('Transparenzpflichten nach Art. 50.', 'Transparency obligations under Art. 50.'),
		explanation: L(
			`Personen sind über die Interaktion mit KI bzw. über künstlich erzeugte Inhalte zu informieren; die Pflichten gelten ab dem ${DATES.transparency.de}.`,
			`Persons must be told that they interact with AI or that content is artificially generated; the duties apply from ${DATES.transparency.en}.`
		)
	},
	minimal: {
		verdict: 'negative',
		headline: L('Minimales Risiko.', 'Minimal risk.'),
		explanation: L(
			'Keine besonderen Pflichten der KI-Verordnung über die allgemeinen hinaus.',
			'No specific AI Act obligations beyond the general ones.'
		)
	},
	ausserhalb: {
		verdict: 'negative',
		headline: L('Nicht von der KI-Verordnung erfasst.', 'Not covered by the AI Act.'),
		explanation: L(
			'Kein KI-System im Sinne des Art. 3 Nr. 1 oder vom Anwendungsbereich ausgenommen (Art. 2). Die Einstufung ist bei Änderungen zu wiederholen.',
			'Not an AI system within Art. 3(1) or excluded from the scope (Art. 2). Repeat the classification when anything changes.'
		)
	},
	ungeklaert: {
		verdict: 'conditional',
		headline: L('Risikoklasse ungeklärt.', 'Risk class unclear.'),
		explanation: L(
			'Ohne Einstufung lassen sich die Pflichten nicht bestimmen. Die Risikoklassifizierung durchführen und das Ergebnis übernehmen.',
			'Without a classification the obligations cannot be determined. Run the risk classification and attach the result.'
		)
	}
};

const has = (record: RecordView, field: string, value: string) => {
	const list = record.data[field];
	return Array.isArray(list) && list.includes(value);
};

/**
 * the obligations that follow from the register entry: risk class, role and
 * data. A summary for the record page, not a substitute for the
 * questionnaires it points to.
 */
function assess(record: RecordView): QuestionnaireResult {
	const riskClass = (record.data.risikoklasse as RiskClass | null) ?? 'ungeklaert';
	const role = record.data.rolle;
	const deployer = role === 'betreiber' || role === 'beides';
	const provider = role === 'anbieter' || role === 'beides';
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'KI-VO', ref: 'Art. 6' }];

	if (riskClass === 'hochriskant') {
		if (deployer) {
			notes.push(
				L(
					'Als Betreiber: Pflichten nach Art. 26 (Verwendung nach Betriebsanleitung, menschliche Aufsicht, Eingabedaten, Überwachung, Protokolle, Information der Beschäftigten) und ggf. Grundrechte-Folgenabschätzung nach Art. 27; das Werkzeug Betreiberpflichten prüft sie im Einzelnen.',
					'As a deployer: Art. 26 duties (use per instructions, human oversight, input data, monitoring, logs, informing workers) and, where applicable, a fundamental rights impact assessment under Art. 27; the deployer obligations tool checks them in detail.'
				)
			);
			citations.push({ law: 'KI-VO', ref: 'Art. 26' }, { law: 'KI-VO', ref: 'Art. 27' });
		}
		if (provider) {
			notes.push(
				L(
					'Als Anbieter: Anforderungen der Art. 9 bis 15, Qualitätsmanagementsystem (Art. 17), technische Dokumentation (Art. 11, Anhang IV), Konformitätsbewertung (Art. 43), CE-Kennzeichnung und Registrierung (Art. 49).',
					'As a provider: requirements of Art. 9 to 15, quality management system (Art. 17), technical documentation (Art. 11, Annex IV), conformity assessment (Art. 43), CE marking and registration (Art. 49).'
				)
			);
			citations.push({ law: 'KI-VO', ref: 'Art. 16' });
		}
	}
	if (riskClass === 'art6_3') {
		notes.push(
			L(
				'Bewertung nach Art. 6 Abs. 4 dokumentieren und der Behörde auf Verlangen vorlegen.',
				'Document the Art. 6(4) assessment and provide it to the authority on request.'
			)
		);
		if (provider) {
			notes.push(
				L(
					'Als Anbieter das System nach Art. 49 Abs. 2 in der EU-Datenbank registrieren.',
					'As a provider, register the system in the EU database under Art. 49(2).'
				)
			);
		}
	}
	if (riskClass === 'art50') {
		notes.push(
			L(
				'Die Einzelpflichten nach Rolle prüft das Werkzeug Transparenzpflichten.',
				'The transparency obligations tool checks the individual duties by role.'
			)
		);
		citations.push({ law: 'KI-VO', ref: 'Art. 50' });
	}
	if (riskClass === 'ungeklaert' || (riskClass !== 'ausserhalb' && !record.data.einstufung)) {
		notes.push(
			L(
				'Die Risikoklasse ist nicht mit einer Risikoklassifizierung belegt; diese durchführen und das Ergebnis übernehmen.',
				'The risk class is not backed by a risk classification; run it and attach the result.'
			)
		);
	}
	if (riskClass !== 'ausserhalb') {
		notes.push(
			L(
				'KI-Kompetenz der Beschäftigten, die das System bedienen, sicherstellen (Art. 4).',
				'Ensure AI literacy of the staff operating the system (Art. 4).'
			)
		);
		citations.push({ law: 'KI-VO', ref: 'Art. 4' });
	}
	if (record.data.gpai === true) {
		notes.push(
			L(
				'Das zugrunde liegende Modell mit allgemeinem Verwendungszweck unterliegt beim Modellanbieter den Pflichten der Art. 53 ff.; dessen Informationen für nachgelagerte Anbieter (Art. 53 Abs. 1 lit. b) für die eigene Bewertung anfordern.',
				'The underlying general-purpose model is subject to Art. 53 et seq. at the model provider; request its information for downstream providers (Art. 53(1)(b)) for your own assessment.'
			)
		);
	}
	if (record.data.personenbezug === true) {
		notes.push(
			L(
				'Personenbezogene Daten: Rechtsgrundlage, Informationspflichten und die Notwendigkeit einer DSFA prüfen (Werkzeuge DSFA-Schwellwertanalyse und KI und DSGVO).',
				'Personal data: check the legal basis, information duties and whether a DPIA is needed (DPIA screening and AI and GDPR tools).'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 35' });
	}
	if (has(record, 'datenkategorien', 'art9') || has(record, 'datenkategorien', 'biometrie')) {
		notes.push(
			L(
				'Besondere Kategorien personenbezogener Daten: Ausnahme nach Art. 9 Abs. 2 DSGVO erforderlich; eine DSFA ist regelmäßig geboten.',
				'Special categories of personal data: an exception under Art. 9(2) GDPR is required; a DPIA is usually necessary.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 9' });
	}
	if (has(record, 'datenkategorien', 'beschaeftigte')) {
		notes.push(
			L(
				'Beschäftigtendaten: Mitbestimmung des Betriebsrats nach § 87 Abs. 1 Nr. 6 BetrVG prüfen.',
				'Employee data: check the works council co-determination right under § 87(1) No. 6 BetrVG.'
			)
		);
		citations.push({ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' });
	}

	return {
		...SUMMARY[riskClass],
		outcome: riskClass,
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess, fromAssessment };
export { definition };
