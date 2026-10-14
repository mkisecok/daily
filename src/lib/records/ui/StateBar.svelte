<!--
	@component
	Where a workflow record stands: the states in order with the current one
	marked, then the possible next steps. A step whose required fields are
	empty is disabled and names what is missing.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import type { RecordToolDefinition, StoredRecord } from '../types.js';
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
				{#each options as { transition, missing } (transition.to)}
					<button
						type="button"
						class="quiet"
						disabled={busy || missing.length > 0}
						onclick={() => ontransition(transition.to)}
					>
						{text(transition.label)}
					</button>
				{/each}
			</div>
			{#each options.filter((o) => o.missing.length > 0) as { transition, missing } (transition.to)}
				<p class="missing">
					{text(transition.label)}: {m.records_missing({ fields: labels(missing) })}
				</p>
			{/each}
		</div>
	{/if}
</section>

<style>
	.state-bar {
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.states {
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

	.next {
		display: grid;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	.missing {
		font-size: 13px;
		color: var(--ink3);
	}
</style>
