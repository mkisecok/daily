<!--
	@component
	Deadlines on paper: a table with the due date, the deadline, its entry,
	tool and legal basis, oldest first. Dates only, with "überfällig" written
	out; a relative time like "in 3 Tagen" would be wrong the day after
	printing. Shown only on paper.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cite, text } from '#lib/tools/i18n.js';
	import { getTool } from '#lib/tools/registry.js';
	import type { Deadline } from '../types.js';

	let { deadlines, now = new Date() }: { deadlines: Deadline[]; now?: Date } = $props();

	const locale = getLocale();
	const sorted = $derived([...deadlines].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
	const toolName = (slug: string) => {
		const tool = getTool(slug);
		return tool ? text(tool.name) : slug;
	};
</script>

<table class="print-table print-only">
	<thead>
		<tr>
			<th class="due">{m.print_due()}</th>
			<th>{m.print_deadline()}</th>
			<th>{m.print_entry()}</th>
			<th>{m.print_tool()}</th>
			<th class="basis">{m.print_basis()}</th>
		</tr>
	</thead>
	<tbody>
		{#each sorted as deadline (deadline.recordId + deadline.kind)}
			<tr>
				<td class="due">
					{formatShortDate(deadline.dueAt, locale)}{#if Date.parse(deadline.dueAt) < now.getTime()}
						<br /><strong>{m.print_overdue()}</strong>{/if}
				</td>
				<td>{text(deadline.label)}</td>
				<td>{deadline.recordTitle}</td>
				<td>{toolName(deadline.toolSlug)}</td>
				<td class="basis">{deadline.cite ? cite(deadline.cite) : ''}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.due {
		width: 22mm;
		white-space: nowrap;
	}
</style>
