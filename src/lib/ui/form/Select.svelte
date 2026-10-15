<!--
	@component
	Single-choice dropdown on Bits UI: a field-like trigger, a floating list with
	the chosen item checked in khaki and keyboard navigation. `id` sits on the
	trigger, so a `<label for>` names it. An empty value means nothing chosen.
-->
<script lang="ts">
	import { Select } from 'bits-ui';
	import Icon from '../Icon.svelte';

	type Item = { value: string; label: string };

	let {
		id,
		value = $bindable(''),
		items,
		placeholder,
		describedBy,
		invalid = false,
		required = false
	}: {
		id: string;
		value?: string;
		items: Item[];
		placeholder: string;
		describedBy?: string;
		invalid?: boolean;
		required?: boolean;
	} = $props();

	// optional fields offer the placeholder as an item, so a choice can be taken back
	const options = $derived(required ? items : [{ value: '', label: placeholder }, ...items]);
	const selected = $derived(items.find((item) => item.value === value));
</script>

<Select.Root type="single" bind:value items={options}>
	<Select.Trigger
		{id}
		class="daily-control"
		aria-describedby={describedBy}
		aria-invalid={invalid || undefined}
	>
		<span class="daily-control-value" data-placeholder={selected ? undefined : ''}
			>{selected?.label ?? placeholder}</span
		>
		<Icon name="selector" size={16} />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="daily-popover" sideOffset={4}>
			<Select.Viewport class="daily-listbox">
				{#each options as item (item.value)}
					<Select.Item value={item.value} label={item.label} class="daily-option">
						{#snippet children({ selected: isSelected })}
							<span class="daily-control-mark"
								>{#if isSelected}<Icon name="check" size={16} />{/if}</span
							>
							<span>{item.label}</span>
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
