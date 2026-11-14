<!--
	@component
	Tool status as a small badge: available in blue, beta in navy, planned
	neutral.
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
				: status === 'retired'
					? m.status_retired()
					: m.status_planned()
	);
</script>

<span
	class={['badge', { primary: status === 'stable', navy: status === 'beta' }]}
	data-status={status}>{label}</span
>
