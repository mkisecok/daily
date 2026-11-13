import type { RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/**
 * a matter the officer works on: a running number to file everything under,
 * who it is for, and the next step with its date, so that the list of open
 * matters is also the task list
 */
export const definition: RecordToolDefinition = {
	slug: 'vorgang',
	version: 1,
	intro: L(
		'Ein Eintrag je Vorgang: eine Anfrage aus einer Abteilung, ein Projekt, eine Prüfung. Die laufende Nummer dient als Aktenzeichen für Notizen, E-Mails und Unterlagen. Der nächste Schritt mit Datum erscheint unter Fristen und auf der Startseite; Beratungsvermerke werden dem Vorgang zugeordnet.',
		'One entry per matter: a request from a department, a project, a review. The running number is the file reference for notes, emails and documents. The next step with its date appears under deadlines and on the start page; advice memos are filed under the matter.'
	),
	sources: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. a, b' }],
	titleField: 'bezeichnung',
	numbering: 'nummer',
	sections: [
		{
			id: 'vorgang',
			title: L('Vorgang', 'Matter'),
			columns: 2,
			fields: [
				{
					id: 'nummer',
					type: 'text',
					label: L('Nummer', 'Number'),
					help: L(
						'Jahr, Monat und laufende Nummer; als Aktenzeichen für Ordner und Betreff nutzen.',
						'Year, month and a running number; use it as the reference for folders and subject lines.'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Videoüberwachung Lager“.', 'E.g. "Video surveillance warehouse".'),
					required: true,
					listColumn: true
				},
				{
					id: 'fuer_wen',
					type: 'text',
					label: L('Für wen', 'For whom'),
					help: L('Abteilung, Mandant oder Person.', 'Department, client or person.'),
					listColumn: true
				},
				{
					id: 'begonnen_am',
					type: 'date',
					label: L('Begonnen am', 'Started on')
				},
				{
					id: 'worum',
					type: 'textarea',
					label: L('Worum geht es?', 'What is it about?')
				}
			]
		},
		{
			id: 'schritt',
			title: L('Nächster Schritt', 'Next step'),
			columns: 2,
			fields: [
				{
					id: 'naechster_schritt',
					type: 'text',
					label: L('Was ist als Nächstes zu tun?', 'What is to be done next?'),
					help: L(
						'Eine konkrete Handlung, z. B. „Entwurf der Hinweisschilder an Facility schicken“.',
						'One concrete action, e.g. "Send the draft signs to facility management".'
					),
					listColumn: true
				},
				{
					id: 'faellig_am',
					type: 'date',
					label: L('Bis wann', 'By when'),
					listColumn: true
				},
				{
					id: 'wartet_auf',
					type: 'text',
					label: L('Wartet auf', 'Waiting for'),
					help: L(
						'Wer muss liefern, bevor es weitergeht?',
						'Who has to deliver before it can go on?'
					)
				}
			]
		},
		{
			id: 'ablage',
			title: L('Ablage', 'Filing'),
			fields: [
				{
					id: 'ablageort',
					type: 'text',
					label: L('Wo liegen die Unterlagen?', 'Where are the documents?'),
					help: L('Ordner, Laufwerk oder Postfach.', 'Folder, drive or mailbox.')
				},
				{ id: 'ergebnis', type: 'textarea', label: L('Ergebnis', 'Outcome') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'offen', label: L('Offen', 'Open') },
			{ id: 'wartet', label: L('Wartet', 'Waiting') },
			{ id: 'erledigt', label: L('Erledigt', 'Done'), terminal: true }
		],
		initialState: 'offen',
		transitions: [
			{ from: 'offen', to: 'wartet', label: L('Wartet auf andere', 'Waiting for others') },
			{ from: 'wartet', to: 'offen', label: L('Weiter bearbeiten', 'Continue') },
			{ from: 'offen', to: 'erledigt', label: L('Erledigt', 'Done') },
			{ from: 'wartet', to: 'erledigt', label: L('Erledigt', 'Done') },
			{ from: 'erledigt', to: 'offen', label: L('Wieder öffnen', 'Reopen') }
		]
	},
	example: {
		nummer: '2026-11-007',
		bezeichnung: 'Videoüberwachung Lager (Beispiel)',
		fuer_wen: 'Logistik, Herr Beispiel',
		begonnen_am: '2026-11-03',
		worum:
			'Die Logistik will nach zwei Diebstählen Kameras an den Laderampen. Zu klären: Zweck, Bereiche, Speicherdauer, Betriebsrat.',
		naechster_schritt: 'Lageplan mit Kamerastandorten bei der Logistik anfordern',
		faellig_am: '2026-11-20',
		ablageort: 'Laufwerk Datenschutz, Ordner mit der Vorgangsnummer'
	}
};
