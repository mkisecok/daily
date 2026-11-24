import { checkStatus, gapDeadlines } from '../../records/checks.js';
import { dateAfterMonths, dayAt, monthsPassed } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { CLAUSES, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** a contract is checked again a year after the last check, unless a date is set */
const REVIEW_MONTHS = 12;

/** whether the last check is more than a year old on `now` */
export function reviewOutdated(record: RecordView, now = new Date()): boolean {
	const last = text(record.data.geprueft_am);
	return !!last && monthsPassed(last, REVIEW_MONTHS, now);
}

/** whether the certificate or audit report has run out on `now` */
export function evidenceExpired(record: RecordView, now = new Date()): boolean {
	const until = text(record.data.nachweis_bis);
	return !!until && now.getTime() > Date.parse(dayAt(until, '23:59'));
}

/**
 * the review date, or a year after the last check; the end of the
 * evidence; and each missing clause that has a date to be fixed by
 */
function deadlines(record: RecordView): DeadlineSpec[] {
	if (record.data.status === 'beendet') return [];
	const specs: DeadlineSpec[] = [];
	const last = text(record.data.geprueft_am);
	const date =
		text(record.data.wiedervorlage) || (last ? dateAfterMonths(last, REVIEW_MONTHS) : '');
	if (date) {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Auftragsverarbeitungsvertrag', 'Processor contract review'),
			dueAt: dayAt(date),
			cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 1' }
		});
	}
	const until = text(record.data.nachweis_bis);
	if (until) {
		specs.push({
			kind: 'nachweis',
			label: L('Nachweis des Auftragsverarbeiters läuft ab', 'Processor evidence expires'),
			dueAt: dayAt(until),
			cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 1, 5' }
		});
	}
	return [...specs, ...gapDeadlines(definition, record)];
}

const reason = (id: string, text: Localized, cite?: LegalBasis): Reason => ({
	questionId: id,
	text,
	cite
});

/**
 * the checklist result: clauses answered "no" are defects, clauses not yet
 * answered keep the check open. Then the points around the contract:
 * guarantees, transfers, sub-processors, breach reporting.
 */
function assess(record: RecordView): QuestionnaireResult {
	const missing = CLAUSES.filter((c) => checkStatus(record.data[c.id]) === 'nein').map((c) =>
		reason(c.id, c.label, c.cite)
	);
	const open = CLAUSES.filter((c) => checkStatus(record.data[c.id]) === null);
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 28' }];

	if (record.data.genehmigung === 'allgemein' && record.data.einspruch !== true) {
		missing.push(
			reason(
				'einspruch',
				L(
					'Bei allgemeiner Genehmigung: Information über beabsichtigte Änderungen und Möglichkeit zum Einspruch',
					'With a general authorisation: information on intended changes and the opportunity to object'
				),
				{ law: 'DSGVO', ref: 'Art. 28 Abs. 2 Satz 2' }
			)
		);
	}
	const chain = record.data.genehmigung === 'einzeln' || record.data.genehmigung === 'allgemein';
	if (chain && record.data.gleiche_pflichten === false) {
		missing.push(
			reason(
				'gleiche_pflichten',
				L(
					'Unterauftragsverarbeitern werden dieselben Pflichten auferlegt; der Auftragsverarbeiter haftet für sie',
					'Sub-processors take on the same obligations; the processor remains liable for them'
				),
				{ law: 'DSGVO', ref: 'Art. 28 Abs. 4' }
			)
		);
	} else if (chain && record.data.gleiche_pflichten !== true) {
		notes.push(
			L(
				'Prüfen, ob der Vertrag Unterauftragsverarbeitern dieselben Pflichten auferlegt und der Auftragsverarbeiter für sie haftet (Art. 28 Abs. 4).',
				'Check whether the contract passes the same obligations on to sub-processors and keeps the processor liable for them (Art. 28(4)).'
			)
		);
	}
	if (chain && text(record.data.unterauftragnehmer) === '') {
		notes.push(
			L(
				'Die Unterauftragsverarbeiter sind nicht benannt: Der Verantwortliche muss jeden in der Kette mit Name, Sitz und Leistung kennen (EDPB-Stellungnahme 22/2024).',
				'The sub-processors are not named: the controller must know each one in the chain by name, location and service (EDPB Opinion 22/2024).'
			)
		);
	}
	if (record.data.meldung_pannen === false) {
		notes.push(
			L(
				'Der Vertrag sollte eine unverzügliche Meldung von Datenpannen regeln; ohne sie gefährdet jede Panne beim Auftragsverarbeiter die eigene 72-Stunden-Frist (Art. 33 Abs. 2).',
				'The contract should require breaches to be reported without undue delay; without it, every breach at the processor endangers your own 72-hour period (Art. 33(2)).'
			)
		);
	}
	if (record.data.garantien === 'keiner' || record.data.garantien === 'selbstauskunft') {
		notes.push(
			L(
				'Der Verantwortliche darf nur Auftragsverarbeiter einsetzen, die hinreichende Garantien bieten (Art. 28 Abs. 1). Eine bloße Selbstauskunft genügt bei sensiblen Verarbeitungen selten; Zertifikate oder Prüfberichte anfordern.',
				'Controllers may only use processors providing sufficient guarantees (Art. 28(1)). A mere self-assessment rarely suffices for sensitive processing; request certificates or audit reports.'
			)
		);
	}
	if (record.data.sitz === 'drittland') {
		const check = record.data.transfer_check;
		const headline =
			check && typeof check === 'object' && !Array.isArray(check) && 'headline' in check
				? (check.headline as Localized)
				: null;
		notes.push(
			headline
				? L(`Drittlandprüfung: ${headline.de}`, `Third-country transfer check: ${headline.en}`)
				: L(
						'Verarbeitung in Drittländern: Übermittlungsgrundlage nach Art. 44 ff. erforderlich; die Drittlandprüfung im Eintrag klärt sie.',
						'Processing in third countries: a transfer basis under Art. 44 et seq. is required; the third-country transfer check in the entry establishes it.'
					)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 44' });
	}
	if (evidenceExpired(record)) {
		notes.push(
			L(
				'Der Nachweis hinreichender Garantien ist abgelaufen: ein aktuelles Zertifikat oder einen neuen Prüfbericht anfordern.',
				'The evidence of sufficient guarantees has expired: request a current certificate or a new audit report.'
			)
		);
	}
	if (record.data.status !== 'beendet' && reviewOutdated(record)) {
		notes.push(
			L(
				'Die letzte Prüfung liegt mehr als zwölf Monate zurück: Vertrag, Unterauftragsverarbeiter und Nachweise erneut prüfen.',
				'The last check is more than twelve months old: check the contract, sub-processors and evidence again.'
			)
		);
	}
	if (record.data.status === 'beendet' && record.data.loeschbestaetigung !== true) {
		notes.push(
			L(
				'Vertrag beendet: eine Bestätigung über Löschung oder Rückgabe aller Daten anfordern und ablegen (Art. 28 Abs. 3 lit. g).',
				'Contract ended: request and file a confirmation that all data was deleted or returned (Art. 28(3)(g)).'
			)
		);
	}
	if (record.data.besondere_kategorien === true) {
		notes.push(
			L(
				'Besondere Kategorien: Die Maßnahmen nach Art. 32 müssen dem höheren Risiko entsprechen; Nachweise genauer prüfen.',
				'Special categories: the Art. 32 measures must match the higher risk; examine the evidence more closely.'
			)
		);
	}
	if (record.data.vertragsart === 'scc') {
		notes.push(
			L(
				'Die Standardvertragsklauseln nach Art. 28 Abs. 7 (Durchführungsbeschluss (EU) 2021/915) erfüllen Art. 28 Abs. 3, wenn die Anhänge vollständig ausgefüllt sind.',
				'The standard contractual clauses under Art. 28(7) (Implementing Decision (EU) 2021/915) meet Art. 28(3) if the annexes are completed in full.'
			)
		);
	}

	if (missing.length > 0 && record.data.status === 'freigegeben') {
		notes.push(
			L(
				'Der Status lautet „Freigegeben“, obwohl Pflichtinhalte fehlen; den Status auf „Nachbesserung angefordert“ setzen.',
				'The status says “Approved” although mandatory content is missing; set it to “Amendment requested”.'
			)
		);
	}

	if (missing.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'maengel',
			headline: L(
				'Vertrag erfüllt Art. 28 nicht vollständig.',
				'Contract does not fully meet Art. 28.'
			),
			explanation: L(
				'Die folgenden Pflichtinhalte fehlen. Nachbesserung verlangen, bevor (weiter) Daten übermittelt werden; ohne wirksamen Vertrag fehlt der Verarbeitung durch den Dienstleister die Grundlage.',
				'The mandatory content below is missing. Request an amendment before (further) data is passed on; without a valid contract, processing by the service provider lacks a basis.'
			),
			reasons: missing,
			notes,
			citations
		};
	}
	if (open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L(
				`Prüfung offen: ${open.length} von ${CLAUSES.length} Punkten.`,
				`Check open: ${open.length} of ${CLAUSES.length} clauses.`
			),
			explanation: L(
				'Die Prüfliste ist noch nicht vollständig beantwortet.',
				'The checklist has not been answered in full yet.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erfuellt',
		headline: L('Vertrag entspricht Art. 28 Abs. 3.', 'Contract meets Art. 28(3).'),
		explanation: L(
			'Alle Pflichtinhalte sind geregelt. Bei Änderungen der Leistung oder der Unterauftragsverarbeiter erneut prüfen.',
			'All mandatory content is covered. Check again when the service or the sub-processors change.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { CLAUSES, definition };
