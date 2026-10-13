<!--
	@component
	The dateline of a newspaper: weekday, long date, issue number. Serif, muted,
	followed by a hairline.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate } from '#lib/i18n/date.js';

	let {
		date,
		issue,
		locale
	}: {
		date: string;
		issue: number;
		locale: string;
	} = $props();
</script>

<p class="dateline">
	<time datetime={date.slice(0, 10)}>{formatLongDate(date, locale)}</time>
	<span class="issue">{m.dateline_issue({ n: String(issue) })}</span>
</p>

<style>
	.dateline {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid var(--rule);
		font-family: var(--serif);
		font-size: 15px;
		color: var(--ink2);

		& .issue {
			font-family: var(--mono);
			font-size: 11px;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--ink3);
		}
	}
</style>
