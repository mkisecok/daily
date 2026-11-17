import type { Component } from 'svelte';
import type { PrintRow } from '../print/meta.js';
import type { Titles } from '../records/format.js';
import type { Details } from '../organisation/slots.js';
import type { Composed } from '../records/links.js';
import type { RecordEngine, RecordToolDefinition, StoredRecord } from '../records/types.js';
import { m } from '../paraglide/messages.js';
import { getLocale } from '../paraglide/runtime.js';
import AccessPrint from './betroffenenanfrage/AccessPrint.svelte';
import AuditPrint from './auditbericht/AuditPrint.svelte';
import { auditHead } from './auditbericht/print.js';
import { accessHead, accessReady } from './betroffenenanfrage/print.js';
import BreachPrint from './datenpanne/BreachPrint.svelte';
import { noticeHead } from './datenpanne/print.js';
import DsfaPrint from './dsfa/DsfaPrint.svelte';
import PolicyPrint from './ki-nutzungsrichtlinie/PolicyPrint.svelte';
import { policyHead } from './ki-nutzungsrichtlinie/print.js';
import { dsfaHead } from './dsfa/print.js';
import IncidentPrint from './vorfallmeldung/IncidentPrint.svelte';
import { incidentHead } from './vorfallmeldung/print.js';
import type { Answers, ToolManifest } from './types.js';
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

/** what a printed entry of its own kind gets */
export type EntryPrintProps = {
	definition: RecordToolDefinition;
	record: StoredRecord;
	titles?: Titles;
	/** the referenced records the entry composes, such as the audit of a report */
	composed?: Composed[];
	/** the organisation's details, such as the DPO's contact for line b of a breach notice */
	details?: Details;
};

/**
 * an entry printed as the document its recipient expects, with the kind of
 * document for its head; every other entry prints as a Vorgangsblatt
 * (PrintEntry.svelte)
 */
export const entryPrints: Partial<
	Record<
		string,
		{
			kind: () => string;
			component: Component<EntryPrintProps>;
			/** only for entries this holds for; the others print as a Vorgangsblatt */
			when?: (record: StoredRecord) => boolean;
			/**
			 * a letter to someone outside: its head shows these rows instead of
			 * Daily's tool, version and review, under the kind as its title
			 */
			letter?: (record: StoredRecord, organisation?: string | null) => PrintRow[];
		}
	>
> = {
	auditbericht: {
		kind: m.print_kind_audit,
		component: AuditPrint,
		letter: (record, organisation) => auditHead(record, organisation, getLocale())
	},
	betroffenenanfrage: {
		kind: m.print_kind_access,
		component: AccessPrint,
		when: (record) => accessReady(record.data),
		letter: (record, organisation) => accessHead(record.data, organisation)
	},
	datenpanne: {
		kind: m.print_kind_breach,
		component: BreachPrint,
		letter: (record, organisation) => noticeHead(record, organisation, getLocale())
	},
	dsfa: {
		kind: m.print_kind_dsfa,
		component: DsfaPrint,
		letter: (record, organisation) => dsfaHead(record, organisation, getLocale())
	},
	vorfallmeldung: {
		kind: m.print_kind_incident,
		component: IncidentPrint,
		letter: (record, organisation) => incidentHead(record, organisation, getLocale())
	}
};

/** what a questionnaire result printed as a document of its own gets */
export type ReportPrintProps = { answers: Answers };

/**
 * a questionnaire result printed as the document it drafts, under a letter
 * head, instead of the Prüfbericht (PrintReport.svelte)
 */
export const reportPrints: Partial<
	Record<
		string,
		{
			kind: () => string;
			component: Component<ReportPrintProps>;
			/** the rows of the letter head, for the day the result was made */
			letter: (answers: Answers, organisation: string | null | undefined, at: string) => PrintRow[];
		}
	>
> = {
	'ki-nutzungsrichtlinie': {
		kind: m.print_kind_policy,
		component: PolicyPrint,
		letter: policyHead
	}
};
