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
		class="badge num navy count"
		class:overdue={due.overdue}
		aria-label={m.deadlines_due_soon({ count: due.count })}>{due.count}</span
	>
{/if}

<style>
	.count {
		margin-left: auto;

		&.overdue {
			color: var(--on-wax);
			background: var(--wax);
		}
	}
</style>
