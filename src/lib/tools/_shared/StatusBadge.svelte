<!--
	@component
	Tool status as small-caps text with a hairline, never a pill.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { ToolStatus } from '../types.js';

	let { status }: { status: ToolStatus } = $props();

	const label = $derived(
		status === 'stable'
			? m.status_stable()
			: status === 'beta'
				? m.status_beta()
				: m.status_planned()
	);
</script>

<span class="badge" data-status={status}>{label}</span>

<style>
	.badge {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		padding: 0.15rem 0;
		border-bottom: 1px solid currentColor;
		color: var(--ink3);

		&[data-status='stable'] {
			color: var(--khaki);
		}

		&[data-status='beta'] {
			color: var(--navy);
		}
	}
</style>
