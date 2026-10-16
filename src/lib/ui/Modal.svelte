<!--
	@component
	Modal dialog on the native `<dialog>`: the page behind is inert, focus moves
	into the dialog and returns to the trigger, Esc and a click on the backdrop
	close it. `open` is bindable.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		onclose,
		children
	}: { open?: boolean; title: string; onclose?: () => void; children: Snippet } = $props();

	const titleId = $props.id();

	/** keeps the element in step with `open`; re-runs whenever `open` changes */
	function sync(dialog: HTMLDialogElement) {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}

	function closed() {
		open = false;
		onclose?.();
	}

	/** the sheet fills the dialog, so a click on the dialog itself is a click on the backdrop */
	function backdrop(event: MouseEvent & { currentTarget: HTMLDialogElement }) {
		if (event.target === event.currentTarget) event.currentTarget.close();
	}
</script>

<!-- the Esc key closes the dialog natively, so the backdrop click needs no key handler -->
<dialog {@attach sync} class="modal" aria-labelledby={titleId} onclose={closed} onclick={backdrop}>
	<div class="sheet">
		<h2 id={titleId}>{title}</h2>
		{@render children()}
	</div>
</dialog>

<style>
	.modal {
		width: min(28rem, calc(100vw - 2rem));
		margin: auto;
		padding: 0;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-modal);

		&::backdrop {
			background: rgba(28, 27, 25, 0.35);
		}

		& .sheet {
			padding: 1.25rem 1.4rem 1.2rem;
		}

		& h2 {
			margin-bottom: 0.6rem;
			font-size: 20px;
		}
	}
</style>
