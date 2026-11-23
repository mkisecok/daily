import type { FieldSection, RecordToolDefinition } from '../../records/types.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string) => ({ de, en });

/** one protection goal of the Standard Data Protection Model: typical measures plus details */
function goal(
	id: string,
	title: Localized,
	cite: LegalBasis,
	measures: [string, Localized][]
): FieldSection {
	return {
		id,
		title,
		fields: [
			{
				id: `${id}_massnahmen`,
				type: 'multiselect',
				label: L('Umgesetzte Maßnahmen', 'Measures in place'),
				options: measures.map(([value, label]) => ({ value, label })),
				cite
			},
			{ id: `${id}_details`, type: 'textarea', label: L('Einzelheiten', 'Details') }
		]
	};
}

/** the seven protection goals of the SDM, in its order */
export const GOALS = [
	goal(
		'vertraulichkeit',
		L('Vertraulichkeit', 'Confidentiality'),
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' },
		[
			['zutritt', L('Zutrittskontrolle zu Räumen', 'Physical access control')],
			[
				'authentisierung',
				L('Authentisierung mit starken Passwörtern', 'Authentication with strong passwords')
			],
			['mfa', L('Mehr-Faktor-Authentisierung', 'Multi-factor authentication')],
			['rollen', L('Rollen- und Berechtigungskonzept', 'Role and permission concept')],
			['transport', L('Verschlüsselung bei der Übertragung', 'Encryption in transit')],
			['ruhe', L('Verschlüsselung gespeicherter Daten', 'Encryption at rest')],
			['verpflichtung', L('Verpflichtung auf Vertraulichkeit', 'Confidentiality undertakings')],
			[
				'bildschirmsperre',
				L('Bildschirmsperre und aufgeräumter Arbeitsplatz', 'Screen lock and clear desk')
			],
			['admin', L('Getrennte Administratorkonten', 'Separate administrator accounts')],
			['netz', L('Netzsegmentierung und Firewall', 'Network segmentation and firewall')],
			['fernzugriff', L('Gesicherter Fernzugriff (VPN)', 'Secured remote access (VPN)')],
			[
				'endgeraete',
				L(
					'Verwaltete Endgeräte mit Festplattenverschlüsselung',
					'Managed devices with disk encryption'
				)
			],
			[
				'rechtepruefung',
				L('Regelmäßige Überprüfung der Berechtigungen', 'Regular review of permissions')
			],
			['austritt', L('Entzug der Rechte beim Austritt', 'Access removed when people leave')],
			[
				'entsorgung',
				L(
					'Sichere Entsorgung von Datenträgern (DIN 66399)',
					'Secure disposal of storage media (DIN 66399)'
				)
			]
		]
	),
	goal(
		'integritaet',
		L('Integrität', 'Integrity'),
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' },
		[
			['protokoll', L('Protokollierung von Änderungen', 'Logging of changes')],
			['pruefsummen', L('Prüfsummen oder Signaturen', 'Checksums or signatures')],
			['vier_augen', L('Vier-Augen-Prinzip', 'Four-eyes principle')],
			['schreibschutz', L('Schreibschutz und Versionierung', 'Write protection and versioning')],
			['schadsoftware', L('Schutz vor Schadsoftware', 'Malware protection')],
			['plausibilitaet', L('Plausibilitätsprüfung von Eingaben', 'Validation of input')],
			[
				'aenderungen',
				L(
					'Geregeltes Änderungsmanagement mit Tests vor dem Einsatz',
					'Change management with tests before release'
				)
			]
		]
	),
	goal(
		'verfuegbarkeit',
		L('Verfügbarkeit', 'Availability'),
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b, c' },
		[
			['backup', L('Regelmäßige Datensicherung', 'Regular backups')],
			['wiederherstellung', L('Getestete Wiederherstellung', 'Tested restore')],
			['redundanz', L('Redundante Systeme', 'Redundant systems')],
			['notfall', L('Notfallplan', 'Contingency plan')],
			['patches', L('Patch-Management', 'Patch management')],
			[
				'offline_backup',
				L('Offline oder unveränderlich gespeicherte Sicherung', 'Offline or immutable backups')
			],
			[
				'physisch',
				L(
					'Unterbrechungsfreie Stromversorgung, Brand- und Wasserschutz',
					'Uninterruptible power supply, fire and water protection'
				)
			],
			['monitoring', L('Überwachung mit Alarmierung', 'Monitoring with alerts')],
			['kapazitaet', L('Kapazitätsplanung und Lasttests', 'Capacity planning and load tests')],
			['ueberlast', L('Schutz vor Überlastung (DDoS)', 'Protection against overload (DDoS)')]
		]
	),
	goal(
		'datenminimierung',
		L('Datenminimierung', 'Data minimisation'),
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c, Art. 25' },
		[
			['loeschroutinen', L('Automatische Löschroutinen', 'Automatic deletion routines')],
			['voreinstellungen', L('Datensparsame Voreinstellungen', 'Privacy-friendly defaults')],
			['pseudonymisierung', L('Pseudonymisierung', 'Pseudonymisation')],
			['anonymisierung', L('Anonymisierung für Auswertungen', 'Anonymisation for analysis')],
			['loeschkonzept', L('Dokumentiertes Löschkonzept', 'Documented deletion concept')]
		]
	),
	goal(
		'nichtverkettung',
		L('Nichtverkettung', 'Unlinkability'),
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. b' },
		[
			['zwecktrennung', L('Getrennte Verarbeitung je Zweck', 'Separate processing per purpose')],
			[
				'mandantentrennung',
				L('Mandanten- oder Datenbanktrennung', 'Tenant or database separation')
			],
			[
				'zugriffsbeschraenkung',
				L(
					'Zugriff nur für den Zweck nötiger Personen',
					'Access limited to those needed for the purpose'
				)
			]
		]
	),
	goal(
		'transparenz',
		L('Transparenz', 'Transparency'),
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. a' },
		[
			[
				'dokumentation',
				L(
					'Dokumentation von Verfahren und Datenflüssen',
					'Documentation of procedures and data flows'
				)
			],
			['auswertung', L('Auswertung der Protokolle', 'Review of logs')],
			[
				'informationen',
				L('Datenschutzhinweise für Betroffene', 'Privacy notices for data subjects')
			],
			[
				'auftragsverarbeiter',
				L(
					'Verträge mit Auftragsverarbeitern und deren Kontrolle',
					'Contracts with processors and their review'
				)
			]
		]
	),
	goal(
		'intervenierbarkeit',
		L('Intervenierbarkeit', 'Intervenability'),
		{ law: 'DSGVO', ref: 'Art. 12–22' },
		[
			['betroffenenprozess', L('Prozess für Betroffenenrechte', 'Process for data subject rights')],
			[
				'korrektur',
				L(
					'Berichtigung, Sperrung und Löschung im System möglich',
					'Correction, restriction and erasure possible in the system'
				)
			],
			[
				'abschaltung',
				L('Einzelne Funktionen abschaltbar', 'Individual functions can be switched off')
			],
			[
				'export',
				L('Datenexport in gängigem Format (Art. 20)', 'Data export in a common format (Art. 20)')
			],
			[
				'einwilligung',
				L('Einwilligungen verwaltbar und widerrufbar', 'Consents can be managed and withdrawn')
			]
		]
	)
];

/** measures for the whole organisation, beside the goals */
export const ORGANISATION: FieldSection = {
	id: 'organisation',
	title: L('Organisation', 'Organisation'),
	fields: [
		{
			id: 'organisation_massnahmen',
			type: 'multiselect',
			label: L('Umgesetzte Maßnahmen', 'Measures in place'),
			options: [
				{
					value: 'schulung',
					label: L(
						'Schulung und Sensibilisierung der Beschäftigten',
						'Training and awareness of staff'
					)
				},
				{
					value: 'richtlinien',
					label: L(
						'Verbindliche Richtlinien zu IT und Datenschutz',
						'Binding IT and data protection policies'
					)
				},
				{
					value: 'datenpannen',
					label: L(
						'Prozess für Datenpannen (Art. 33, 34)',
						'Process for data breaches (Art. 33, 34)'
					)
				}
			],
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
		},
		{ id: 'organisation_details', type: 'textarea', label: L('Einzelheiten', 'Details') }
	]
};

/**
 * technical and organisational measures per system or processing
 * environment, structured by the protection goals of the Standard Data
 * Protection Model (SDM) of the German supervisory authorities.
 */
export const definition: RecordToolDefinition = {
	slug: 'tom-katalog',
	version: 3,
	intro: L(
		'Ein Eintrag je System oder Verarbeitungsumgebung. Die Maßnahmen folgen den sieben Gewährleistungszielen des Standard-Datenschutzmodells (SDM) der Aufsichtsbehörden und belegen die Sicherheit der Verarbeitung nach Art. 32 DSGVO. Dazu kommen organisatorische Maßnahmen für das ganze Haus und offene Maßnahmen mit Frist. Die Beschreibung kann im Verzeichnis von Verarbeitungstätigkeiten in Bezug genommen werden.',
		'One entry per system or processing environment. The measures follow the seven protection goals of the Standard Data Protection Model (SDM) of the German authorities and evidence the security of processing under Art. 32 GDPR. Organisational measures for the whole organisation and open measures with a due date come on top. The record of processing activities can refer to the entry.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'DSGVO', ref: 'Art. 25' },
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell' }
	],
	titleField: 'system',
	sections: [
		{
			id: 'system',
			title: L('System', 'System'),
			fields: [
				{
					id: 'system',
					type: 'text',
					label: L('System oder Umgebung', 'System or environment'),
					required: true,
					listColumn: true
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Verarbeitungstätigkeit im VVT', 'Processing activity in the record'),
					help: L(
						'Die Verarbeitungstätigkeit, deren Daten dieses System verarbeitet; im VVT verweist Art. 30 Abs. 1 lit. g auf diese Maßnahmen.',
						'The processing activity whose data this system processes; in the record, Art. 30(1)(g) refers to these measures.'
					)
				},
				{
					id: 'beschreibung',
					type: 'textarea',
					label: L('Beschreibung und Verarbeitungen', 'Description and processing activities')
				},
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortlich', 'Responsible'),
					listColumn: true
				},
				{
					id: 'schutzbedarf',
					type: 'select',
					label: L('Schutzbedarf', 'Protection requirement'),
					options: [
						{ value: 'normal', label: L('Normal', 'Normal') },
						{ value: 'hoch', label: L('Hoch', 'High') },
						{ value: 'sehr_hoch', label: L('Sehr hoch', 'Very high') }
					],
					help: L(
						'Nach Schwere und Eintrittswahrscheinlichkeit der Folgen für die Betroffenen.',
						'By severity and likelihood of the consequences for data subjects.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 2' },
					required: true,
					listColumn: true
				}
			]
		},
		...GOALS,
		ORGANISATION,
		{
			id: 'offen',
			title: L('Offene Maßnahmen', 'Open measures'),
			fields: [
				{
					id: 'offene_massnahmen',
					type: 'textarea',
					label: L('Geplante Maßnahmen', 'Planned measures'),
					help: L(
						'Was noch fehlt und wer es umsetzt, eine Maßnahme je Zeile.',
						'What is still missing and who implements it, one measure per line.'
					)
				},
				{
					id: 'offen_bis',
					type: 'date',
					label: L('Umsetzen bis', 'Implement by')
				}
			]
		},
		{
			id: 'pruefung',
			title: L('Überprüfung', 'Review'),
			fields: [
				{
					id: 'geprueft_am',
					type: 'date',
					label: L('Wirksamkeit zuletzt überprüft', 'Effectiveness last reviewed'),
					cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
				},
				{
					id: 'pruefergebnis',
					type: 'textarea',
					label: L('Ergebnis der Überprüfung', 'Review result')
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'entwurf', label: L('Entwurf', 'Draft') },
						{ value: 'teilweise', label: L('Teilweise umgesetzt', 'Partly implemented') },
						{ value: 'umgesetzt', label: L('Umgesetzt', 'Implemented') }
					],
					required: true,
					listColumn: true
				},
				{ id: 'wiedervorlage', type: 'date', label: L('Wiedervorlage', 'Next review') }
			]
		}
	],
	example: {
		system: 'Kundensystem (CRM) (Beispiel)',
		beschreibung:
			'Stammdaten, Verträge und Kontaktverlauf aller Kunden; Zugriff für Vertrieb und Kundenservice.',
		verantwortlich: 'Leitung IT',
		schutzbedarf: 'hoch',
		vertraulichkeit_massnahmen: ['authentisierung', 'mfa', 'rollen', 'transport'],
		vertraulichkeit_details:
			'Anmeldung über das zentrale Verzeichnis mit zweitem Faktor; Rollen je Team.',
		integritaet_massnahmen: ['protokoll'],
		verfuegbarkeit_massnahmen: ['backup', 'patches', 'monitoring'],
		verfuegbarkeit_details: 'Tägliche Sicherung; die Wiederherstellung wurde noch nie geprobt.',
		datenminimierung_massnahmen: ['loeschroutinen'],
		intervenierbarkeit_massnahmen: ['betroffenenprozess', 'korrektur'],
		organisation_massnahmen: ['schulung', 'datenpannen'],
		offene_massnahmen:
			'Wiederherstellung aus der Sicherung proben (Leitung IT)\nDatenbank verschlüsseln (Dienstleister)',
		offen_bis: '2027-01-31',
		geprueft_am: '2026-05-20',
		status: 'teilweise',
		wiedervorlage: '2027-05-20'
	}
};
