import { LAWS } from '../normen/laws.js';
import type { LawId } from '../normen/types.js';
import { LAW_VERSIONS, type LawVersion } from '../normen/versions.js';
import { allFields } from '../records/validate.js';
import { getQuestionnaire, getRecordTool } from './registry.js';
import type { LegalBasis, ToolManifest } from './types.js';

/** every citation of a tool: manifest, questionnaire catalog and record definition */
export function toolCites(tool: ToolManifest): LegalBasis[] {
	const catalog = getQuestionnaire(tool.slug)?.catalog;
	const definition = getRecordTool(tool.slug)?.definition;
	return [
		...tool.legalBasis,
		...(catalog?.sources ?? []),
		...(catalog?.sections.flatMap((s) => s.questions.flatMap((q) => (q.cite ? [q.cite] : []))) ??
			[]),
		...(definition?.sources ?? []),
		...(definition ? allFields(definition).flatMap((f) => (f.cite ? [f.cite] : [])) : [])
	];
}

export type LawInUse = { id: LawId; law: string } & LawVersion;

/** the imported laws a tool cites, in the order of the Navigator, with their versions */
export function lawsInUse(tool: ToolManifest): LawInUse[] {
	const cited = new Set(toolCites(tool).map((basis) => basis.law as string));
	return LAWS.filter((meta) => cited.has(meta.law)).map((meta) => ({
		id: meta.id,
		law: meta.law,
		...LAW_VERSIONS[meta.id]
	}));
}
