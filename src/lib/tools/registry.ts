import type {
	QuestionnaireCatalog,
	QuestionnaireEngine,
	ToolCategory,
	ToolManifest
} from './types.js';
import { dsfaSchwellwert } from './dsfa-schwellwert/tool.js';
import { vvt } from './vvt/tool.js';
import { risikoklassifizierung } from './risikoklassifizierung/tool.js';
import { transparenzpflichten } from './transparenzpflichten/tool.js';
import { betreiberpflichten } from './betreiberpflichten/tool.js';
import { interessenabwaegung } from './interessenabwaegung/tool.js';
import { einwilligungCheck } from './einwilligung-check/tool.js';
import { drittlandTransfer } from './drittland-transfer/tool.js';
import { datenpanne } from './datenpanne/tool.js';
import { betroffenenanfrage } from './betroffenenanfrage/tool.js';
import { kiDsgvoSchnittstelle } from './ki-dsgvo-schnittstelle/tool.js';
import { technischeDokumentation } from './technische-dokumentation/tool.js';
import { kiNutzungsrichtlinie } from './ki-nutzungsrichtlinie/tool.js';
import { kiRegister } from './ki-register/tool.js';
import type { RecordTool } from '../records/types.js';
import { avvPruefung } from './avv-pruefung/tool.js';
import { tomKatalog } from './tom-katalog/tool.js';
import { loeschkonzept } from './loeschkonzept/tool.js';
import { schulungsnachweis } from './schulungsnachweis/tool.js';
import { kiKompetenz } from './ki-kompetenz/tool.js';
import { vorfallmeldung } from './vorfallmeldung/tool.js';
import { dsfa } from './dsfa/tool.js';
import { grundrechteFolgenabschaetzung } from './grundrechte-folgenabschaetzung/tool.js';
import { auditprogramm } from './auditprogramm/tool.js';
import { pruefkatalog } from './pruefkatalog/tool.js';
import { feststellungen } from './feststellungen/tool.js';
import { auditbericht } from './auditbericht/tool.js';
import { aimsGap } from './aims-gap/tool.js';
import { planned } from './planned.js';

/**
 * Every tool the platform knows about, built or planned. Order within a
 * category is the order shown in the catalogue.
 */
export const tools: readonly ToolManifest[] = [
	vvt.manifest,
	dsfa.manifest,
	dsfaSchwellwert.manifest,
	risikoklassifizierung.manifest,
	transparenzpflichten.manifest,
	betreiberpflichten.manifest,
	interessenabwaegung.manifest,
	einwilligungCheck.manifest,
	drittlandTransfer.manifest,
	datenpanne.manifest,
	betroffenenanfrage.manifest,
	avvPruefung.manifest,
	tomKatalog.manifest,
	loeschkonzept.manifest,
	schulungsnachweis.manifest,
	kiDsgvoSchnittstelle.manifest,
	technischeDokumentation.manifest,
	kiNutzungsrichtlinie.manifest,
	aimsGap.manifest,
	kiRegister.manifest,
	kiKompetenz.manifest,
	vorfallmeldung.manifest,
	grundrechteFolgenabschaetzung.manifest,
	auditprogramm.manifest,
	pruefkatalog.manifest,
	feststellungen.manifest,
	auditbericht.manifest,
	...planned
];

export const categories: readonly ToolCategory[] = ['datenschutz', 'ki', 'audit', 'entwickler'];

export function getTool(slug: string): ToolManifest | undefined {
	return tools.find((tool) => tool.slug === slug);
}

export function toolsByCategory(category: ToolCategory): ToolManifest[] {
	return tools.filter((tool) => tool.category === category);
}

/** Runnable questionnaire tools: catalog + engine, keyed by slug. */
const questionnaires: Record<
	string,
	{ catalog: QuestionnaireCatalog; engine: QuestionnaireEngine }
> = {
	[aimsGap.manifest.slug]: {
		catalog: aimsGap.catalog,
		engine: aimsGap.engine
	},
	[dsfaSchwellwert.manifest.slug]: {
		catalog: dsfaSchwellwert.catalog,
		engine: dsfaSchwellwert.engine
	},
	[risikoklassifizierung.manifest.slug]: {
		catalog: risikoklassifizierung.catalog,
		engine: risikoklassifizierung.engine
	},
	[transparenzpflichten.manifest.slug]: {
		catalog: transparenzpflichten.catalog,
		engine: transparenzpflichten.engine
	},
	[betreiberpflichten.manifest.slug]: {
		catalog: betreiberpflichten.catalog,
		engine: betreiberpflichten.engine
	},
	[interessenabwaegung.manifest.slug]: {
		catalog: interessenabwaegung.catalog,
		engine: interessenabwaegung.engine
	},
	[einwilligungCheck.manifest.slug]: {
		catalog: einwilligungCheck.catalog,
		engine: einwilligungCheck.engine
	},
	[drittlandTransfer.manifest.slug]: {
		catalog: drittlandTransfer.catalog,
		engine: drittlandTransfer.engine
	},
	[kiDsgvoSchnittstelle.manifest.slug]: {
		catalog: kiDsgvoSchnittstelle.catalog,
		engine: kiDsgvoSchnittstelle.engine
	},
	[technischeDokumentation.manifest.slug]: {
		catalog: technischeDokumentation.catalog,
		engine: technischeDokumentation.engine
	},
	[kiNutzungsrichtlinie.manifest.slug]: {
		catalog: kiNutzungsrichtlinie.catalog,
		engine: kiNutzungsrichtlinie.engine
	}
};

export function getQuestionnaire(slug: string) {
	return questionnaires[slug];
}

/** Register and workflow tools: definition + engine, keyed by slug. */
const recordTools: Record<string, RecordTool> = {
	[auditbericht.manifest.slug]: auditbericht,
	[feststellungen.manifest.slug]: feststellungen,
	[pruefkatalog.manifest.slug]: pruefkatalog,
	[auditprogramm.manifest.slug]: auditprogramm,
	[grundrechteFolgenabschaetzung.manifest.slug]: grundrechteFolgenabschaetzung,
	[dsfa.manifest.slug]: dsfa,
	[vorfallmeldung.manifest.slug]: vorfallmeldung,
	[kiKompetenz.manifest.slug]: kiKompetenz,
	[schulungsnachweis.manifest.slug]: schulungsnachweis,
	[loeschkonzept.manifest.slug]: loeschkonzept,
	[tomKatalog.manifest.slug]: tomKatalog,
	[avvPruefung.manifest.slug]: avvPruefung,
	[vvt.manifest.slug]: vvt,
	[datenpanne.manifest.slug]: datenpanne,
	[betroffenenanfrage.manifest.slug]: betroffenenanfrage,
	[kiRegister.manifest.slug]: kiRegister
};

export function getRecordTool(slug: string): RecordTool | undefined {
	return recordTools[slug];
}

/** Every register and workflow tool. */
export function listRecordTools(): RecordTool[] {
	return Object.values(recordTools);
}
