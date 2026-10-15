import type { RecordToolDefinition, RecordView } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** whether the incident falls under Art. 3(49) at all and is not ruled out as caused by the system */
export function reportable(record: RecordView): boolean {
	const kinds = record.data.art;
	return Array.isArray(kinds) && kinds.length > 0 && record.data.kausalitaet !== 'ausgeschlossen';
}

/** a serious incident with a high-risk AI system (Art. 3(49), Art. 73, Art. 26(5)) */
export const definition: RecordToolDefinition = {
	slug: 'vorfallmeldung',
	version: 1,
	intro: L(
		'Ein Eintrag je möglichem schwerwiegendem Vorfall mit einem Hochrisiko-KI-System. Ab Kenntnis laufen die Meldefristen des Art. 73 KI-VO: höchstens 15 Tage, 10 Tage bei einem Todesfall, 2 Tage bei einem weitverbreiteten Verstoß oder einer Störung kritischer Infrastruktur. Betreiber informieren zuerst den Anbieter (Art. 26 Abs. 5).',
		'One entry per possible serious incident with a high-risk AI system. From awareness the reporting periods of Art. 73 AI Act run: at most 15 days, 10 days in case of death, 2 days for a widespread infringement or a disruption of critical infrastructure. Deployers inform the provider first (Art. 26(5)).'
	),
	sources: [
		{ law: 'KI-VO', ref: 'Art. 3 Nr. 49' },
		{ law: 'KI-VO', ref: 'Art. 73' },
		{ law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorfall',
			title: L('Vorfall', 'Incident'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Title'),
					required: true,
					listColumn: true
				},
				{
					id: 'ki_system',
					type: 'text',
					label: L('KI-System', 'AI system'),
					help: L('Bezeichnung wie im KI-Register.', 'Name as in the AI system register.'),
					listColumn: true
				},
				{
					id: 'rolle',
					type: 'select',
					label: L('Rolle der Organisation', 'Role of the organisation'),
					options: [
						{ value: 'anbieter', label: L('Anbieter', 'Provider') },
						{ value: 'betreiber', label: L('Betreiber', 'Deployer') }
					],
					required: true
				},
				{
					id: 'kenntnis',
					type: 'datetime',
					label: L('Kenntnis am', 'Aware since'),
					help: L(
						'Ab hier laufen die Fristen; Daily rechnet ab der Minute.',
						'The periods run from here; Daily counts from the minute.'
					),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 2' },
					required: true,
					listColumn: true
				},
				{
					id: 'beschreibung',
					type: 'textarea',
					label: L('Was ist geschehen?', 'What happened?'),
					required: true
				}
			]
		},
		{
			id: 'einordnung',
			title: L('Einordnung', 'Classification'),
			fields: [
				{
					id: 'art',
					type: 'multiselect',
					label: L('Art des Vorfalls', 'Kind of incident'),
					options: [
						{
							value: 'gesundheit',
							label: L(
								'Tod oder schwere Schädigung der Gesundheit (lit. a)',
								'Death or serious harm to health ((a))'
							)
						},
						{
							value: 'infrastruktur',
							label: L(
								'Schwere, unumkehrbare Störung kritischer Infrastruktur (lit. b)',
								'Serious and irreversible disruption of critical infrastructure ((b))'
							)
						},
						{
							value: 'grundrechte',
							label: L(
								'Verstoß gegen Pflichten zum Schutz der Grundrechte (lit. c)',
								'Infringement of obligations protecting fundamental rights ((c))'
							)
						},
						{
							value: 'eigentum',
							label: L(
								'Schwerer Schaden an Eigentum oder Umwelt (lit. d)',
								'Serious harm to property or the environment ((d))'
							)
						}
					],
					help: L(
						'Keine Auswahl, wenn keine dieser Folgen eingetreten ist.',
						'Leave empty if none of these consequences occurred.'
					),
					cite: { law: 'KI-VO', ref: 'Art. 3 Nr. 49' }
				},
				{
					id: 'todesfall',
					type: 'boolean',
					label: L('Eine Person ist verstorben', 'A person has died'),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 4' }
				},
				{
					id: 'weitverbreitet',
					type: 'boolean',
					label: L('Weitverbreiteter Verstoß', 'Widespread infringement'),
					help: L(
						'Verstoß, der Personen in mindestens zwei weiteren Mitgliedstaaten schadet oder zu schaden droht (Art. 3 Nr. 61).',
						'Infringement harming or likely to harm persons in at least two other Member States (Art. 3(61)).'
					),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 3' }
				},
				{
					id: 'kausalitaet',
					type: 'select',
					label: L('Zusammenhang mit dem KI-System', 'Link to the AI system'),
					options: [
						{ value: 'festgestellt', label: L('Festgestellt', 'Established') },
						{
							value: 'wahrscheinlich',
							label: L('Hinreichend wahrscheinlich', 'Reasonably likely')
						},
						{ value: 'ungeklaert', label: L('Noch ungeklärt', 'Not yet clear') },
						{ value: 'ausgeschlossen', label: L('Ausgeschlossen', 'Ruled out') }
					],
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 2' }
				},
				{
					id: 'datenpanne',
					type: 'boolean',
					label: L(
						'Zugleich Verletzung des Schutzes personenbezogener Daten',
						'Also a personal data breach'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33' }
				}
			]
		},
		{
			id: 'meldung',
			title: L('Meldung', 'Report'),
			fields: [
				{
					id: 'anbieter_informiert_am',
					type: 'datetime',
					label: L('Anbieter informiert am', 'Provider informed on'),
					help: L('Nur als Betreiber.', 'Deployers only.'),
					cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
				},
				{
					id: 'behoerde',
					type: 'text',
					label: L('Marktüberwachungsbehörde', 'Market surveillance authority')
				},
				{
					id: 'gemeldet_am',
					type: 'datetime',
					label: L('Gemeldet am', 'Reported on'),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 1' }
				},
				{
					id: 'erstmeldung',
					type: 'boolean',
					label: L(
						'Erstmeldung unvollständig, Nachmeldung folgt',
						'Initial report incomplete, follow-up to come'
					),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 5' }
				},
				{ id: 'aktenzeichen', type: 'text', label: L('Aktenzeichen', 'Reference') }
			]
		},
		{
			id: 'untersuchung',
			title: L('Untersuchung', 'Investigation'),
			fields: [
				{
					id: 'untersuchung',
					type: 'textarea',
					label: L('Untersuchung und Risikobewertung', 'Investigation and risk assessment'),
					cite: { law: 'KI-VO', ref: 'Art. 73 Abs. 6' }
				},
				{ id: 'korrektur', type: 'textarea', label: L('Korrekturmaßnahmen', 'Corrective action') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'erfasst', label: L('Erfasst', 'Recorded') },
			{ id: 'gemeldet', label: L('Gemeldet', 'Reported') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true },
			{ id: 'kein_meldefall', label: L('Kein Meldefall', 'Not reportable'), terminal: true }
		],
		initialState: 'erfasst',
		transitions: [
			{
				from: 'erfasst',
				to: 'gemeldet',
				label: L('Meldung erfasst', 'Report made'),
				requires: ['behoerde', 'gemeldet_am']
			},
			{
				from: 'erfasst',
				to: 'kein_meldefall',
				label: L('Als kein Meldefall dokumentieren', 'Document as not reportable'),
				requires: ['untersuchung'],
				check: (record) =>
					reportable(record)
						? L(
								'Nur möglich, wenn keine Folge nach Art. 3 Nr. 49 vorliegt oder ein Zusammenhang mit dem KI-System ausgeschlossen ist.',
								'Only possible if no consequence under Art. 3(49) occurred or a link to the AI system is ruled out.'
							)
						: null
			},
			{
				from: 'gemeldet',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['untersuchung', 'korrektur']
			}
		]
	}
};
