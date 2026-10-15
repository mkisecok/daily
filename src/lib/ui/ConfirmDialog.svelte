<!--
	@component
	Confirmation in a modal dialog. With `typeToConfirm` the action stays
	disabled until that word is typed, for actions that are hard to undo.
	`tone` danger paints the action in wax. Cancel comes first, so it holds the
	initial focus.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';
	import { confirmMatches } from './confirm.js';
	import type { IconName } from './icons.js';

	let {
		open = $bindable(false),
		title,
		body,
		confirmLabel,
		tone = 'action',
		icon,
		typeToConfirm,
		onconfirm
	}: {
		open?: boolean;
		title: string;
		body: string;
		confirmLabel: string;
		tone?: 'action' | 'danger';
		icon?: IconName;
		typeToConfirm?: string;
		onconfirm: () => void;
	} = $props();

	const inputId = $props.id();
	let typed = $state('');
	const ready = $derived(confirmMatches(typed, typeToConfirm));

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!ready) return;
		open = false;
		onconfirm();
	}
</script>

<Modal bind:open {title} onclose={() => (typed = '')}>
	<form class="confirm" data-tone={tone} onsubmit={submit}>
		<div class="message">
			{#if icon}<span class="badge"><Icon name={icon} size={20} /></span>{/if}
			<p>{body}</p>
		</div>
		{#if typeToConfirm}
			<label class="typed" for={inputId}>{m.confirm_type({ word: typeToConfirm })}</label>
			<input
				id={inputId}
				class="typed-input"
				bind:value={typed}
				autocomplete="off"
				spellcheck="false"
			/>
		{/if}
		<div class="toolbar actions">
			<button type="button" class="quiet" onclick={() => (open = false)}>
				{m.dialog_cancel()}
			</button>
			<button type="submit" class:danger={tone === 'danger'} disabled={!ready}>
				{confirmLabel}
			</button>
		</div>
	</form>
</Modal>

<style>
	.confirm {
		display: grid;
		gap: 0.9rem;

		& .message {
			display: flex;
			gap: 0.8rem;
			align-items: flex-start;
			color: var(--ink2);

			& .badge {
				display: grid;
				flex: none;
				place-items: center;
				width: 2.2rem;
				height: 2.2rem;
				color: var(--khaki);
				background: var(--khaki-soft);
				border-radius: 50%;
			}
		}

		&[data-tone='danger'] .badge {
			color: var(--wax);
			background: var(--wax-soft);
		}

		& .typed {
			margin-bottom: -0.5rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .typed-input {
			width: 100%;
			font-family: var(--mono);
		}

		& .actions {
			justify-content: flex-end;
			margin-top: 0.3rem;
		}
	}
</style>
