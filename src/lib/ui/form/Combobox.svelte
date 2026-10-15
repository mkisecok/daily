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
	let input = $state<HTMLInputElement | null>(null);
	const matches = $derived(
		search === ''
			? items
			: items.filter((item) => item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
	);
	const labelOf = (v: string) => items.find((item) => item.value === v)?.label ?? '';

	/**
	 * keeps the text and the stored value in step when the user leaves the
	 * field: an emptied optional field stores nothing, anything else shows the
	 * chosen item's label again (typed filters that matched nothing included)
	 */
	function settle() {
		if (!input) return;
		if (input.value.trim() === '' && !required) value = '';
		input.value = labelOf(value);
		search = '';
	}
</script>

<Combobox.Root
	type="single"
	bind:value
	bind:open
	{items}
	allowDeselect={!required}
	onOpenChange={(isOpen) => {
		if (!isOpen) settle();
	}}
>
	<div class="daily-control daily-combobox">
		<Combobox.Input
			{id}
			bind:ref={input}
			class="daily-combobox-input"
			defaultValue={labelOf(value)}
			clearOnDeselect
			{placeholder}
			aria-describedby={describedBy}
			aria-invalid={invalid || undefined}
			aria-required={required || undefined}
			oninput={(event) => (search = event.currentTarget.value)}
			onclick={() => (open = true)}
			onblur={() => {
				if (!open) settle();
			}}
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
