import type { Component } from 'svelte';
import type { Titles } from '../records/format.js';
import type { RecordEngine, RecordToolDefinition, StoredRecord } from '../records/types.js';
import type { ToolManifest } from './types.js';
import VvtPrint from './vvt/VvtPrint.svelte';

/** what a printed register gets: the tool, its entries and who they belong to */
export type RegisterPrintProps = {
	definition: RecordToolDefinition;
	tool: ToolManifest;
	records: StoredRecord[];
	engine?: RecordEngine;
	organisation?: string | null;
	titles?: Titles;
};

/**
 * a register printed as the document its recipient expects, by tool slug;
 * every other register prints as a Registerauszug (PrintRegister.svelte)
 */
export const registerPrints: Partial<Record<string, Component<RegisterPrintProps>>> = {
	vvt: VvtPrint
};
