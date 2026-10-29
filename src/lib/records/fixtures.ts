import type { Questionnaire } from './operations.js';
import type { RecordData, RecordTool, RecordToolDefinition } from './types.js';

const L = (de: string, en: string) => ({ de, en });

/** a small definition covering every field type, shared by the framework tests */
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

/** the test definition as a tool whose engine turns `due` into a deadline */
export const testTool: RecordTool = {
	manifest: {
		slug: testDefinition.slug,
		category: 'datenschutz',
		status: 'beta',
		shape: 'workflow',
		version: testDefinition.version,
		name: L('Testregister', 'Test register'),
		summary: L('', ''),
		legalBasis: []
	},
	definition: testDefinition,
	engine: {
		deadlines: (record) =>
			typeof record.data.due === 'string'
				? [{ kind: 'due', label: L('Fällig', 'Due'), dueAt: `${record.data.due}T00:00:00.000Z` }]
				: [],
		fromAssessment: (_field, result): RecordData => (result.outcome === 'ja' ? { kind: 'a' } : {})
	}
};

/** the `demo` questionnaire the test definition's assessment field names */
export const testQuestionnaire: Questionnaire = {
	catalog: {
		slug: 'demo',
		version: 2,
		intro: L('', ''),
		sources: [],
		sections: [
			{
				id: 's',
				title: L('Fragen', 'Questions'),
				questions: [
					{ id: 'q1', type: 'yesno', text: L('Erforderlich?', 'Required?') },
					{ id: 'q2', type: 'yesnona', text: L('Anwendbar?', 'Applicable?') }
				]
			}
		]
	},
	engine: (_catalog, answers) =>
		answers.q1 === 'yes'
			? {
					verdict: 'positive',
					outcome: 'ja',
					headline: L('Erforderlich.', 'Required.'),
					explanation: L('', ''),
					reasons: [],
					citations: []
				}
			: {
					verdict: 'negative',
					headline: L('Nicht erforderlich.', 'Not required.'),
					explanation: L('', ''),
					reasons: [],
					citations: []
				}
};

export const getTestQuestionnaire = (slug: string) =>
	slug === 'demo' ? testQuestionnaire : undefined;

/** a register whose `target` field points to the test register */
export const linkedTool: RecordTool = {
	...testTool,
	manifest: { ...testTool.manifest, slug: 'linked-register' },
	definition: {
		slug: 'linked-register',
		version: 1,
		intro: L('', ''),
		sources: [],
		titleField: 'name',
		sections: [
			{
				id: 'main',
				title: L('Allgemein', 'General'),
				fields: [
					{ id: 'name', type: 'text', label: L('Name', 'Name'), required: true },
					{ id: 'target', type: 'reference', tool: 'test-register', label: L('Bezug', 'Reference') }
				]
			}
		]
	},
	engine: {}
};
