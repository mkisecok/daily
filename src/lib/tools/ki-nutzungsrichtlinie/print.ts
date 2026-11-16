import { formatShortDate } from '../../i18n/date.js';
import { m } from '../../paraglide/messages.js';
import { getLocale } from '../../paraglide/runtime.js';
import type { PrintRow } from '../../print/meta.js';
import type { Answers } from '../types.js';

/**
 * the head of the policy: the organisation, where known, and the version by
 * its day, marked as a draft while a decision is still open
 */
export function policyHead(
	answers: Answers,
	organisation: string | null | undefined,
	at: string
): PrintRow[] {
	const rows: PrintRow[] = [];
	if (organisation) rows.push({ label: m.print_organisation(), value: organisation });
	const day = formatShortDate(at, getLocale());
	const open = Object.values(answers).includes('unknown');
	rows.push({
		label: m.print_policy_version(),
		value: open ? `${m.print_policy_draft()}, ${day}` : day
	});
	return rows;
}
