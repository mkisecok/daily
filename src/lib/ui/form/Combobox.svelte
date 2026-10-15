<!--
	@component
	Searchable single choice on Bits UI, for long lists such as records of
	another tool. Typing filters the list; `empty` shows when nothing matches.
	`id` sits on the text input, so a `<label for>` names it.
-->
<script lang="ts">
	import { Combobox } from 'bits-ui';
	import Icon from '../Icon.svelte';

	type Item = { value: string; label: string };

	let {
		id,
		value = $bindable(''),
		items,
		placeholder,
		empty,
		describedBy,
		invalid = false,
		required = false
	}: {
		id: string;
		value?: string;
		items: Item[];
		placeholder: string;
		empty: string;
		describedBy?: string;
		invalid?: boolean;
		required?: boolean;
	} = $props();

	let search = $state('');
	let open = $state(false);
	const matches = $derived(
		search === ''
			? items
			: items.filter((item) => item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
	);
	const selectedLabel = $derived(items.find((item) => item.value === value)?.label ?? '');
</script>

<Combobox.Root
	type="single"
	bind:value
	bind:open
	{items}
	allowDeselect={!required}
	onOpenChange={(open) => {
		if (!open) search = '';
	}}
>
	<div class="daily-control daily-combobox">
		<Combobox.Input
			{id}
			class="daily-combobox-input"
			defaultValue={selectedLabel}
			{placeholder}
			aria-describedby={describedBy}
			aria-invalid={invalid || undefined}
			aria-required={required || undefined}
			oninput={(event) => (search = event.currentTarget.value)}
			onclick={() => (open = true)}
		/>
		<Combobox.Trigger class="daily-icon-button" aria-label={placeholder}>
			<Icon name="selector" size={16} />
		</Combobox.Trigger>
	</div>
	<Combobox.Portal>
		<Combobox.Content class="daily-popover daily-listbox" sideOffset={4}>
			{#each matches as item (item.value)}
				<Combobox.Item value={item.value} label={item.label} class="daily-option">
					{#snippet children({ selected })}
						<span class="daily-control-mark"
							>{#if selected}<Icon name="check" size={16} />{/if}</span
						>
						<span>{item.label}</span>
					{/snippet}
				</Combobox.Item>
			{:else}
				<span class="daily-empty">{empty}</span>
			{/each}
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
