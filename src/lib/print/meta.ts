import { formatShortDate } from '../i18n/date.js';
import { m } from '../paraglide/messages.js';
import { getLocale } from '../paraglide/runtime.js';
import { text } from '../tools/i18n.js';
import { rechtsstand } from '../tools/rechtsstand.js';
import type { LawAsOf, ToolManifest } from '../tools/types.js';

/** one line of the meta table on a printed document */
export type PrintRow = { label: string; value: string };

/**
 * the meta table of a printed document: tool with its version, the law it
 * is based on, the day it was made and, where known, the organisation and
 * the entry
 */
export function printMeta(
	tool: ToolManifest,
	options: {
		version: number;
		/** when the result or entry was made; today when not given */
		at?: string;
		organisation?: string | null;
		/** the law versions stored with a saved result */
		lawAsOf?: LawAsOf[];
		entry?: { id: string; state?: string };
	}
): PrintRow[] {
	const locale = getLocale();
	const date = (iso: string) => formatShortDate(iso, locale);
	const law = rechtsstand(tool, options.lawAsOf)
		.map((entry) => `${entry.law} ${date(entry.asOf)}`)
		.join(', ');
	const rows: PrintRow[] = [];
	if (options.organisation)
		rows.push({ label: m.print_organisation(), value: options.organisation });
	rows.push({
		label: m.print_tool(),
		value: `${text(tool.name)}, ${m.print_version({ version: String(options.version) })}`
	});
	if (law) rows.push({ label: m.rechtsstand_label(), value: law });
	rows.push({
		label: m.print_review(),
		value: tool.reviewedAt
			? m.rechtsstand_reviewed({ date: date(tool.reviewedAt) })
			: m.rechtsstand_unreviewed()
	});
	if (options.entry) {
		rows.push({
			label: m.print_entry(),
			value: options.entry.state ? `${options.entry.id} · ${options.entry.state}` : options.entry.id
		});
	}
	rows.push({ label: m.print_created(), value: date(options.at ?? new Date().toISOString()) });
	return rows;
}
