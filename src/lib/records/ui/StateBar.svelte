<!--
	@component
	Where a workflow record stands: the states in order with the current one
	marked, then the possible next steps. A step whose required fields are
	empty, or whose own check fails, is disabled and says why.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import type { RecordToolDefinition, StoredRecord, TransitionDef } from '../types.js';
	import { fieldById } from '../validate.js';
	import { allowedTransitions } from '../workflow.js';

	let {
		definition,
		record,
		busy = false,
		ontransition
	}: {
		definition: RecordToolDefinition;
		record: StoredRecord;
		busy?: boolean;
		ontransition: (to: string) => void;
	} = $props();

	const states = $derived(definition.workflow?.states ?? []);
	const options = $derived(record.archivedAt ? [] : allowedTransitions(definition, record));

	/** the step waiting for confirmation */
	let pending = $state<TransitionDef | null>(null);
	let confirming = $state(false);

	const stateLabel = (id: string | null) => {
		const state = states.find((s) => s.id === id);
		return state ? text(state.label) : (id ?? '');
	};

	function ask(transition: TransitionDef) {
		pending = transition;
		confirming = true;
	}

	function labels(ids: string[]): string {
		return ids
			.map((id) => {
				const field = fieldById(definition, id);
				return field ? text(field.label) : id;
			})
			.join(', ');
	}
</script>

<section class="state-bar">
	<ol class="states">
		{#each states as state (state.id)}
			<li aria-current={state.id === record.state ? 'step' : undefined}>{text(state.label)}</li>
		{/each}
	</ol>

	{#if options.length > 0}
		<div class="next">
			<span class="eyebrow">{m.records_next()}</span>
			<div class="toolbar">
				{#each options as { transition, missing, blocked } (transition.to)}
					<button
						type="button"
						class="quiet"
						disabled={busy || missing.length > 0 || blocked !== null}
						onclick={() => ask(transition)}
					>
						{text(transition.label)}
					</button>
				{/each}
			</div>
			{#each options as { transition, missing, blocked } (transition.to)}
				{#if missing.length > 0}
					<p class="missing">
						{text(transition.label)}: {m.records_missing({ fields: labels(missing) })}
					</p>
				{:else if blocked}
					<p class="missing">{text(transition.label)}: {text(blocked)}</p>
				{/if}
			{/each}
		</div>
	{/if}
	{#if pending}
		<ConfirmDialog
			bind:open={confirming}
			title={m.records_transition_title()}
			body={m.records_transition_body({
				from: stateLabel(record.state),
				to: stateLabel(pending.to)
			})}
			confirmLabel={text(pending.label)}
			icon="check"
			onconfirm={() => pending && ontransition(pending.to)}
		/>
	{/if}
</section>

<style>
	.state-bar {
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--rule);

		& .states {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 0;
			list-style: none;
			font-family: var(--mono);
			font-size: 11px;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--ink3);

			& li + li::before {
				content: '→';
				margin: 0 0.75rem;
				color: var(--rule);
			}

			& li[aria-current='step'] {
				color: var(--navy);
				font-weight: 600;
			}
		}

		& .next {
			display: grid;
			gap: 0.6rem;
			margin-top: 1rem;

			& .missing {
				font-size: 13px;
				color: var(--ink3);
			}
		}
	}
</style>
