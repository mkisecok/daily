import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const HinSchG = (ref: string): LegalBasis => ({ law: 'HinSchG', ref });

export const SCOPES = [
	{
		value: 'extern',
		label: L(
			'Ein Dritter betreibt die Meldestelle, etwa eine Kanzlei als Ombudsperson',
			'A third party runs the reporting office, for example a law firm as ombudsperson'
		)
	},
	{
		value: 'verbund',
		label: L(
			'Gemeinsame Meldestelle mit anderen Arbeitgebern',
			'A reporting office shared with other employers'
		)
	},
	{
		value: 'software',
		label: L(
			'Meldungen über eine Plattform oder Software',
			'Reports through a platform or software'
		)
	},
	{
		value: 'anonym',
		label: L('Anonyme Meldungen sind möglich', 'Anonymous reports are possible')
	},
	{ value: 'betriebsrat', label: L('Es gibt einen Betriebsrat', 'There is a works council') }
];

/** the checklist from setting up the office to deleting a closed case */
export const BLOCKS: Block[] = [
	{
		id: 'einrichtung',
		title: L('Meldestelle einrichten', 'Setting up the office'),
		intro: L('Wer zuständig ist und wie gemeldet wird.', 'Who is in charge and how to report.'),
		items: [
			{
				id: 'e_pflicht',
				label: L(
					'Pflicht geprüft: in der Regel mindestens 50 Beschäftigte, in der Finanzbranche unabhängig von der Zahl',
					'Duty checked: usually at least 50 employees, in financial services regardless of the number'
				),
				cite: HinSchG('§ 12 Abs. 2, 3'),
				help: L(
					'Fehlt die Meldestelle, droht ein Bußgeld bis 20.000 Euro (§ 40 Abs. 2 Nr. 2, Abs. 6 HinSchG). Auch freiwillig eingerichtet sollte sie diesen Regeln folgen.',
					'Without an office, a fine of up to 20,000 euros is possible (§ 40(2) no. 2, (6) HinSchG). A voluntary office should follow these rules too.'
				),
				na: false
			},
			{
				id: 'e_personen',
				label: L(
					'Zuständige Personen benannt: unabhängig, fachkundig, ohne Interessenkonflikt',
					'People in charge named: independent, qualified, without conflicts of interest'
				),
				cite: HinSchG('§ 15'),
				na: false
			},
			{
				id: 'e_kanaele',
				label: L(
					'Meldungen mündlich und in Textform möglich; auf Wunsch ein persönliches Treffen',
					'Reports possible orally and in text form; an in-person meeting on request'
				),
				cite: HinSchG('§ 16 Abs. 3'),
				na: false
			},
			{
				id: 'e_extern',
				label: L(
					'Klare, leicht zugängliche Informationen über externe Meldestellen, etwa beim Bundesamt für Justiz',
					'Clear, easily accessible information about external reporting offices, for example at the Federal Office of Justice'
				),
				cite: HinSchG('§ 13 Abs. 2')
			},
			{
				id: 'e_betriebsrat',
				label: L(
					'Betriebsrat beteiligt, etwa über eine Betriebsvereinbarung',
					'Works council involved, for example through a works agreement'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 1, 6' },
				help: L(
					'Mitbestimmt sind Regeln zum Verhalten im Betrieb und technische Einrichtungen, die Verhalten oder Leistung überwachen können; das Ob der Meldestelle selbst gibt das Gesetz vor.',
					'Rules on conduct at work and technical systems that can monitor conduct or performance need co-determination; whether there is an office at all is set by law.'
				),
				scope: ['betriebsrat']
			}
		]
	},
	{
		id: 'dritte',
		title: L('Dritte und Verbund', 'Third parties and sharing'),
		intro: L(
			'Die Pflicht, Verstöße abzustellen, bleibt beim Arbeitgeber.',
			'The duty to remedy violations stays with the employer.'
		),
		scope: ['extern', 'verbund', 'software'],
		items: [
			{
				id: 'd_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Dritten oder dem Plattformanbieter (Werkzeug AVV-Prüfung)',
					'Processing agreement with the third party or the platform provider (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				scope: ['extern', 'software'],
				na: false
			},
			{
				id: 'd_folgemassnahmen',
				label: L(
					'Geregelt, was der Dritte an den Arbeitgeber weitergibt und wer Folgemaßnahmen ergreift',
					'Settled what the third party passes on to the employer and who takes follow-up action'
				),
				cite: HinSchG('§ 14 Abs. 1'),
				scope: ['extern']
			},
			{
				id: 'd_verbund',
				label: L(
					'Gemeinsame Meldestelle nur bei 50 bis 249 Beschäftigten; Verantwortung zwischen den Arbeitgebern geregelt',
					'A shared office only with 50 to 249 employees; responsibility between the employers settled'
				),
				cite: HinSchG('§ 14 Abs. 2'),
				help: L(
					'Die Arbeitgeber legen dann meist als gemeinsam Verantwortliche fest, wer welche Pflichten erfüllt (Art. 26 DSGVO).',
					'The employers then usually set out as joint controllers who meets which duties (Art. 26 GDPR).'
				),
				scope: ['verbund'],
				na: false
			}
		]
	},
	{
		id: 'technik',
		title: L('Plattform und Anonymität', 'Platform and anonymity'),
		intro: L(
			'Wer meldet, muss sich auf die Technik verlassen können.',
			'Those who report must be able to rely on the technology.'
		),
		scope: ['software', 'anonym'],
		items: [
			{
				id: 't_tom',
				label: L(
					'Verschlüsselt, mit Zugriffsrechten nur für die Meldestelle und protokollierten Zugriffen',
					'Encrypted, with access only for the reporting office and logged access'
				),
				cite: DSGVO('Art. 32 Abs. 1'),
				scope: ['software']
			},
			{
				id: 't_anonym',
				label: L(
					'Keine IP-Adressen oder Metadaten, die auf die Person schließen lassen; Rückfragen über ein anonymes Postfach',
					'No IP addresses or metadata that point to the person; questions through an anonymous mailbox'
				),
				cite: HinSchG('§ 16 Abs. 1'),
				help: L(
					'Anonyme Meldungen zu ermöglichen ist keine Pflicht; die Meldestelle sollte sie aber bearbeiten. Wer sie anbietet, muss die Anonymität auch technisch halten.',
					'Enabling anonymous reports is not required, but the office should handle them. Whoever offers them must keep them anonymous technically too.'
				),
				scope: ['anonym']
			}
		]
	},
	{
		id: 'datenschutz',
		title: L('Datenschutz', 'Data protection'),
		intro: L(
			'Meldungen betreffen oft Beschäftigte und manchmal Straftaten.',
			'Reports often concern employees and sometimes criminal offences.'
		),
		items: [
			{
				id: 'p_hinweise',
				label: L(
					'Datenschutzhinweise für Hinweisgebende, an der Meldestelle abrufbar',
					'Privacy notice for those who report, available at the reporting office'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'p_betroffene',
				label: L(
					'Information der gemeldeten Person aufgeschoben, solange sie die Aufklärung gefährdet; die Identität der hinweisgebenden Person bleibt dabei verborgen',
					'Informing the reported person deferred while it would endanger the inquiry; the identity of the person who reported stays hidden'
				),
				cite: DSGVO('Art. 14 Abs. 5 lit. b, Art. 15 Abs. 4'),
				help: L(
					'Auch über das Auskunftsrecht darf die Identität nicht offengelegt werden (§ 8 HinSchG), außer in den Fällen des § 9 HinSchG.',
					'The identity may not be disclosed through the right of access either (§ 8 HinSchG), except in the cases of § 9 HinSchG.'
				)
			},
			{
				id: 'p_vvt',
				label: L(
					'Meldestelle im Verzeichnis von Verarbeitungstätigkeiten erfasst',
					'Reporting office recorded in the record of processing activities'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			}
		]
	},
	{
		id: 'verfahren',
		title: L('Umgang mit Meldungen', 'Handling reports'),
		intro: L('Vom Eingang bis zum Löschen.', 'From receipt to deletion.'),
		items: [
			{
				id: 'v_vertraulich',
				label: L(
					'Nur die zuständigen Personen sehen die Identität von hinweisgebenden, gemeldeten und genannten Personen',
					'Only the people in charge see the identity of those who report, are reported or are named'
				),
				cite: HinSchG('§ 8 Abs. 1, § 16 Abs. 2'),
				na: false
			},
			{
				id: 'v_eingang',
				label: L(
					'Eingang spätestens nach sieben Tagen bestätigt',
					'Receipt confirmed within seven days at the latest'
				),
				cite: HinSchG('§ 17 Abs. 1 Nr. 1'),
				na: false
			},
			{
				id: 'v_rueckmeldung',
				label: L(
					'Rückmeldung über Folgemaßnahmen binnen drei Monaten nach der Bestätigung',
					'Feedback on follow-up action within three months of the confirmation'
				),
				cite: HinSchG('§ 17 Abs. 2'),
				na: false
			},
			{
				id: 'v_doku',
				label: L(
					'Jede Meldung dauerhaft abrufbar dokumentiert, unter Wahrung der Vertraulichkeit',
					'Every report documented and retrievable, keeping confidentiality'
				),
				cite: HinSchG('§ 11 Abs. 1')
			},
			{
				id: 'v_loeschen',
				label: L(
					'Dokumentation drei Jahre nach Abschluss des Verfahrens gelöscht; Löschroutine eingerichtet',
					'Documentation deleted three years after the case is closed; deletion routine in place'
				),
				cite: HinSchG('§ 11 Abs. 5'),
				help: L(
					'Länger nur, soweit dieses oder ein anderes Gesetz es erfordert und es verhältnismäßig ist.',
					'Longer only where this or another law requires it and it is proportionate.'
				),
				na: false
			},
			{
				id: 'v_repressalien',
				label: L(
					'Führungskräfte wissen: Repressalien sind verboten, und bei Nachteilen muss der Arbeitgeber beweisen, dass sie nichts mit der Meldung zu tun haben',
					'Managers know: reprisals are prohibited, and for any disadvantage the employer must prove it has nothing to do with the report'
				),
				cite: HinSchG('§ 36')
			}
		]
	}
];

/** the attached screening result says a DPIA is needed */
export const dpiaNeeded = (data: RecordData) =>
	snapshot(data, 'dsfa_check')?.verdict === 'positive';

/** what still stands in the way of putting the office into operation, or null */
export function launchBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (!snapshot(data, 'dsfa_check')) {
		return L('Erst die DSFA-Schwellwertanalyse durchführen.', 'Run the DPIA screening first.');
	}
	if (dpiaNeeded(data) && !data.dsfa) {
		return L(
			'Die Schwellwertanalyse verlangt eine DSFA; erst die DSFA verknüpfen.',
			'The screening requires a DPIA; link the DPIA first.'
		);
	}
	return null;
}

/** setting up and running an internal reporting office under the HinSchG */
export const definition: RecordToolDefinition = {
	slug: 'hinweisgebersystem',
	version: 1,
	intro: L(
		'Ein Eintrag je interner Meldestelle nach dem Hinweisgeberschutzgesetz. Der Umfang bestimmt, welche Teile gelten. Die Identität aller Beteiligten bleibt vertraulich; Meldungen werden drei Jahre nach Abschluss gelöscht. Ob eine DSFA nötig ist, klärt die verknüpfte Schwellwertanalyse: Beschäftigte als Betroffene, mögliche Straftaten und vertrauliche Inhalte sprechen oft dafür.',
		'One entry per internal reporting office under the German Whistleblower Protection Act. The scope decides which parts apply. The identity of everyone involved stays confidential; reports are deleted three years after closing. The linked screening settles whether a DPIA is needed: employees as data subjects, possible criminal offences and confidential content often point that way.'
	),
	sources: [
		HinSchG('§§ 8, 11, 12, 13, 14, 15, 16, 17, 36, 40'),
		DSGVO('Art. 13, 14, 28, 30, 32, 35'),
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 1, 6' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'meldestelle',
			title: L('Meldestelle', 'Reporting office'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Interne Meldestelle“.', 'E.g. "Internal reporting office".'),
					required: true,
					listColumn: true
				},
				{
					id: 'beschaeftigte',
					type: 'number',
					label: L('Beschäftigte', 'Employees'),
					help: L('In der Regel, also ohne kurze Spitzen.', 'Usually, so without brief peaks.'),
					min: 0,
					integer: true
				},
				{ id: 'zustaendig', type: 'text', label: L('Zuständig', 'In charge'), listColumn: true },
				{
					id: 'start_am',
					type: 'date',
					label: L('Start geplant am', 'Planned start'),
					listColumn: true
				},
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Nächste Überprüfung', 'Next review'),
					help: L(
						'Etwa jährlich: Zuständigkeit, Fristen, Löschung.',
						'About once a year: who is in charge, deadlines, deletion.'
					)
				},
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					options: SCOPES
				}
			]
		},
		{
			id: 'pruefungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			fields: [
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening'),
					cite: DSGVO('Art. 35 Abs. 1')
				},
				{
					id: 'dsfa',
					type: 'reference',
					tool: 'dsfa',
					label: L('DSFA (falls nötig)', 'DPIA (if needed)')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('VVT: Hinweisgebersystem', 'Record of processing: whistleblowing')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Inbetriebnahme', 'Going live'),
			columns: 2,
			fields: [
				{
					id: 'in_betrieb_seit',
					type: 'date',
					label: L('In Betrieb seit', 'Live since')
				},
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'aufbau', label: L('Im Aufbau', 'Being set up') },
			{ id: 'betrieb', label: L('In Betrieb', 'Live') }
		],
		initialState: 'aufbau',
		transitions: [
			{
				from: 'aufbau',
				to: 'betrieb',
				label: L('In Betrieb nehmen', 'Go live'),
				requires: ['in_betrieb_seit'],
				check: (record) => launchBlocked(record.data)
			},
			{ from: 'betrieb', to: 'aufbau', label: L('Überarbeiten', 'Revise') }
		]
	},
	example: {
		bezeichnung: 'Interne Meldestelle (Beispiel)',
		beschaeftigte: 120,
		zustaendig: 'Externe Ombudsperson (Kanzlei)',
		umfang: ['extern', 'software', 'anonym'],
		e_pflicht: 'ja',
		e_personen: 'ja',
		e_kanaele: 'ja',
		d_avv: 'ja',
		t_anonym: 'nein',
		t_anonym_notiz: 'Die Plattform speichert IP-Adressen im Zugriffsprotokoll.',
		v_eingang: 'nein',
		v_eingang_notiz: 'Eingangsbestätigungen gehen bisher nach zwei bis drei Wochen raus.'
	}
};
