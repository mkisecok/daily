import type { RecordToolDefinition } from './types.js';

const L = (de: string, en: string) => ({ de, en });

/** A small definition covering every field type, shared by the framework tests. */
export const testDefinition: RecordToolDefinition = {
	slug: 'test-register',
	version: 1,
	intro: L('', ''),
	sources: [],
	titleField: 'name',
	sections: [
		{
			id: 'main',
			title: L('Allgemein', 'General'),
			fields: [
				{ id: 'name', type: 'text', label: L('Name', 'Name'), required: true, listColumn: true },
				{ id: 'notes', type: 'textarea', label: L('Notizen', 'Notes') },
				{
					id: 'kind',
					type: 'select',
					label: L('Art', 'Kind'),
					options: [
						{ value: 'a', label: L('A', 'A') },
						{ value: 'b', label: L('B', 'B') }
					],
					listColumn: true
				},
				{
					id: 'tags',
					type: 'multiselect',
					label: L('Merkmale', 'Tags'),
					options: [
						{ value: 'x', label: L('X', 'X') },
						{ value: 'y', label: L('Y', 'Y') },
						{ value: 'z', label: L('Z', 'Z') }
					]
				},
				{ id: 'due', type: 'date', label: L('Fällig', 'Due') },
				{ id: 'seen', type: 'datetime', label: L('Gesehen', 'Seen') },
				{ id: 'count', type: 'number', label: L('Anzahl', 'Count'), min: 0 },
				{ id: 'flag', type: 'boolean', label: L('Markiert', 'Flagged') },
				{ id: 'check', type: 'assessment', label: L('Prüfung', 'Assessment'), tool: 'demo' }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'open', label: L('Offen', 'Open') },
			{ id: 'review', label: L('Prüfung', 'Review') },
			{ id: 'done', label: L('Erledigt', 'Done'), terminal: true }
		],
		initialState: 'open',
		transitions: [
			{ from: 'open', to: 'review', label: L('Prüfen', 'Review'), requires: ['kind'] },
			{ from: 'review', to: 'open', label: L('Zurück', 'Back') },
			{ from: 'review', to: 'done', label: L('Abschließen', 'Close'), requires: ['due'] }
		]
	}
};
