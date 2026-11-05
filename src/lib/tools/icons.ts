import type { IconName } from '#lib/ui/icons.js';
import type { ToolCategory } from './types.js';

/** one icon per tool, so the catalogue tiles tell tools apart at a glance */
export const TOOL_ICONS: Record<string, IconName> = {
	vvt: 'list-details',
	dsfa: 'shield-check',
	'dsfa-schwellwert': 'gauge',
	risikoklassifizierung: 'stack-2',
	transparenzpflichten: 'eye',
	betreiberpflichten: 'clipboard-check',
	interessenabwaegung: 'scale',
	'einwilligung-check': 'cookie',
	'drittland-transfer': 'world',
	datenpanne: 'alert-triangle',
	betroffenenanfrage: 'user-question',
	anonymisierer: 'eye-off',
	'avv-pruefung': 'file-certificate',
	'tom-katalog': 'lock',
	loeschkonzept: 'trash-x',
	schulungsnachweis: 'school',
	'ki-dsgvo-schnittstelle': 'arrows-exchange',
	'technische-dokumentation': 'file-text',
	'ki-nutzungsrichtlinie': 'book',
	'aims-gap': 'target',
	'ki-register': 'database',
	'ki-kompetenz': 'certificate',
	vorfallmeldung: 'bell-ringing',
	'grundrechte-folgenabschaetzung': 'users',
	auditprogramm: 'calendar-stats',
	pruefkatalog: 'checklist',
	feststellungen: 'flag',
	auditbericht: 'report',
	'repo-check': 'git-branch',
	'guardrail-test': 'barrier-block'
};

export const AREA_ICONS: Record<ToolCategory, IconName> = {
	datenschutz: 'shield-lock',
	ki: 'sparkles',
	audit: 'clipboard-list',
	entwickler: 'code'
};

export const toolIcon = (slug: string): IconName => TOOL_ICONS[slug] ?? 'tool';
