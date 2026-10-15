<!--
	@component
	On/off switch on Bits UI with its label beside it; khaki when on. Use it for
	settings that apply at once, not for answers that may be left open.
-->
<script lang="ts">
	import { Switch } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		id,
		checked = $bindable(false),
		children
	}: { id: string; checked?: boolean; children: Snippet } = $props();
</script>

<span class="daily-switch-row">
	<Switch.Root {id} bind:checked class="daily-switch">
		<Switch.Thumb class="daily-switch-thumb" />
	</Switch.Root>
	<label for={id}>{@render children()}</label>
</span>
