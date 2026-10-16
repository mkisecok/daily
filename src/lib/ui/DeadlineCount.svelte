<!--
	@component
	Number of open deadlines due within seven days; wax when one is overdue.
	Shows nothing when there are none or the store cannot be read (signed out
	in the full app). The count itself lives in `deadline-count.svelte.ts`,
	shared with the phone menu and refreshed by the layout and by store writes.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { deadlineCount as due } from './deadline-count.svelte.js';
</script>

{#if due.count > 0}
	<span
		class="count"
		class:overdue={due.overdue}
		aria-label={m.deadlines_due_soon({ count: due.count })}>{due.count}</span
	>
{/if}

<style>
	.count {
		min-width: 1.4rem;
		margin-left: auto;
		padding: 0 0.4rem;
		font-family: var(--mono);
		font-size: 11px;
		line-height: 1.4rem;
		text-align: center;
		color: var(--navy);
		background: var(--navy-soft);
		border-radius: 999px;

		&.overdue {
			color: var(--on-wax);
			background: var(--wax);
		}
	}
</style>
