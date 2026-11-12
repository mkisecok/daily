import type { IconName } from '../ui/icons.js';
import type { Localized } from './types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** a situation people come with, and the tool that handles it first */
export type Situation = {
	id: string;
	label: Localized;
	icon: IconName;
	/** the tool to open; its area colours the card */
	tool: string;
};

/**
 * the catalogue's entry by situation ("Was steht an?"): the first eight show
 * at once, the rest behind "Weitere Anlässe". Situations with a running
 * deadline come first.
 */
export const SITUATIONS: Situation[] = [
	{
		id: 'panne',
		label: L('Eine Datenpanne ist passiert', 'A data breach happened'),
		icon: 'alert-triangle',
		tool: 'datenpanne'
	},
	{
		id: 'auskunft',
		label: L('Jemand verlangt Auskunft', 'Someone asks for access'),
		icon: 'user-question',
		tool: 'betroffenenanfrage'
	},
	{
		id: 'personal',
		label: L('Jemand fängt an oder hört auf', 'Someone joins or leaves'),
		icon: 'id-badge',
		tool: 'personalwechsel'
	},
	{
		id: 'software',
		label: L('Neue Software kommt', 'New software is coming'),
		icon: 'package',
		tool: 'software-einfuehrung'
	},
	{
		id: 'ki',
		label: L('Ein KI-Tool soll eingeführt werden', 'An AI tool is to be introduced'),
		icon: 'rocket',
		tool: 'ki-einfuehrung'
	},
	{
		id: 'dienstleister',
		label: L('Ein Dienstleister kommt dazu', 'A service provider joins'),
		icon: 'building',
		tool: 'avv-pruefung'
	},
	{
		id: 'website',
		label: L('Website oder Shop geht online', 'A website or shop goes live'),
		icon: 'browser',
		tool: 'website-start'
	},
	{
		id: 'video',
		label: L('Kameras sollen aufgehängt werden', 'Cameras are to be put up'),
		icon: 'video',
		tool: 'videoueberwachung'
	},
	{
		id: 'behoerde',
		label: L('Post von der Aufsichtsbehörde', 'A letter from the supervisory authority'),
		icon: 'mail-opened',
		tool: 'aufsichtsanfrage'
	},
	{
		id: 'homeoffice',
		label: L('Homeoffice oder eigene Geräte', 'Working from home or on own devices'),
		icon: 'home',
		tool: 'mobiles-arbeiten'
	},
	{
		id: 'wechsel',
		label: L('Ein Dienstleister wird gewechselt', 'A provider is being changed'),
		icon: 'replace',
		tool: 'dienstleisterwechsel'
	},
	{
		id: 'drittland',
		label: L('Daten gehen in ein Drittland', 'Data goes to a third country'),
		icon: 'world',
		tool: 'drittland-transfer'
	},
	{
		id: 'umzug',
		label: L('Büro oder Serverraum zieht um', 'An office or server room moves'),
		icon: 'truck',
		tool: 'standortwechsel'
	},
	{
		id: 'audit',
		label: L('Ein Audit steht an', 'An audit is coming up'),
		icon: 'clipboard-check',
		tool: 'auditprogramm'
	}
];

/** how many situations show before "Weitere Anlässe" */
export const SITUATIONS_SHOWN = 8;
