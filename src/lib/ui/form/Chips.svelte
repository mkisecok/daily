<!--
	@component
	Multiple choice as chips on a Bits UI toggle group: each option is a toggle
	button, chosen ones in khaki with a check. `labelledBy` names the group.
-->
<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import Icon from '../Icon.svelte';

	let {
		value = $bindable([]),
		items,
		labelledBy,
		describedBy
	}: {
		value?: string[];
		items: { value: string; label: string }[];
		labelledBy: string;
		describedBy?: string;
	} = $props();
</script>

<ToggleGroup.Root
	type="multiple"
	bind:value
	class="daily-chips"
	aria-labelledby={labelledBy}
	aria-describedby={describedBy}
>
	{#each items as item (item.value)}
		<ToggleGroup.Item value={item.value} class="daily-chip">
			<Icon name={value.includes(item.value) ? 'check' : 'plus'} size={14} />
			{item.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
