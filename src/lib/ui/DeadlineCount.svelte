<!--
	@component
	Number of open deadlines due within seven days, read from the record store
	in the browser; wax when one is overdue. Shows nothing when there are none
	or the store cannot be read (signed out in the full app). Reloads after
	every navigation, so a saved record updates it.
-->
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { m } from '#lib/paraglide/messages.js';
	import { getStore } from '#lib/records/store/index.js';
	import { dueSoon } from './deadline-count.js';

	let { enabled }: { enabled: boolean } = $props();

	let due = $state({ count: 0, overdue: false });

	afterNavigate(() => {
		if (!enabled) return;
		void getStore()
			.deadlines()
			.then((deadlines) => (due = dueSoon(deadlines, new Date())))
			.catch(() => (due = { count: 0, overdue: false }));
	});
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
