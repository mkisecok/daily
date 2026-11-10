<!--
	@component
	On/off switch on Bits UI with its label beside it: a thin rail with a knob
	that slides right and fills blue when on, and the state as a word ("an",
	"aus") so it does not rest on colour. Use it for settings that apply at
	once, not for answers that may be left open.
-->
<script lang="ts">
	import { Switch } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';

	let {
		id,
		checked = $bindable(false),
		children
	}: { id: string; checked?: boolean; children: Snippet } = $props();
</script>

<span class="daily-switch-row">
	<Switch.Root {id} bind:checked class="daily-switch">
		<span class="daily-switch-rail"><Switch.Thumb class="daily-switch-thumb" /></span>
		<!-- the switch role already announces the state -->
		<span class="daily-switch-word" aria-hidden="true">
			{checked ? m.switch_on() : m.switch_off()}
		</span>
	</Switch.Root>
	<label for={id}>{@render children()}</label>
</span>
