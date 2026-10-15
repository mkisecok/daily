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
			['verpflichtung', L('Verpflichtung auf Vertraulichkeit', 'Confidentiality undertakings')]
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
			['schadsoftware', L('Schutz vor Schadsoftware', 'Malware protection')]
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
			['patches', L('Patch-Management', 'Patch management')]
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
			['anonymisierung', L('Anonymisierung für Auswertungen', 'Anonymisation for analysis')]
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
			]
		]
	)
];

/**
 * technical and organisational measures per system or processing
 * environment, structured by the protection goals of the Standard Data
 * Protection Model (SDM) of the German supervisory authorities.
 */
export const definition: RecordToolDefinition = {
	slug: 'tom-katalog',
	version: 1,
	intro: L(
		'Ein Eintrag je System oder Verarbeitungsumgebung. Die Maßnahmen folgen den sieben Gewährleistungszielen des Standard-Datenschutzmodells (SDM) der Aufsichtsbehörden und belegen die Sicherheit der Verarbeitung nach Art. 32 DSGVO. Die Beschreibung kann im Verzeichnis von Verarbeitungstätigkeiten in Bezug genommen werden.',
		'One entry per system or processing environment. The measures follow the seven protection goals of the Standard Data Protection Model (SDM) of the German authorities and evidence the security of processing under Art. 32 GDPR. The record of processing activities can refer to the entry.'
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
	]
};
