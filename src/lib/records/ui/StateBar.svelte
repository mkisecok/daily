<!--
	@component
	Where a workflow record stands: the states in order, marked as passed,
	current, still possible or not taken (from the record's own transitions,
	never from the order alone), then the possible next steps. A step whose required fields are
	empty, or whose own check fails, is disabled and says why.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import { stateProgress } from '../progress.js';
	import type { RecordEvent, RecordToolDefinition, StoredRecord, TransitionDef } from '../types.js';
	import { fieldById } from '../validate.js';
	import { allowedTransitions } from '../workflow.js';

	let {
		definition,
		record,
		events,
		busy = false,
		ontransition
	}: {
		definition: RecordToolDefinition;
		record: StoredRecord;
		/** the record's history; transitions in it say which states were passed */
		events: RecordEvent[];
		busy?: boolean;
		ontransition: (to: string) => void;
	} = $props();

	const states = $derived(definition.workflow?.states ?? []);
	const progress = $derived(
		new Map(stateProgress(definition, record.state, events).map((p) => [p.id, p.status]))
	);
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

<section class="state-bar card">
	<ol class="states" aria-label={m.records_state()}>
		{#each states as state (state.id)}
			{@const status = progress.get(state.id)}
			<li data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
				{text(state.label)}{#if status === 'done'}<span class="visually-hidden"
						>, {m.records_step_done()}</span
					>{:else if status === 'skipped'}<span class="visually-hidden"
						>, {m.records_step_skipped()}</span
					>{/if}
			</li>
		{/each}
	</ol>

	{#if options.length > 0}
		<div class="next">
			<span class="eyebrow">{m.records_next()}</span>
			<div class="toolbar">
				{#each options as { transition, missing, blocked } (transition.to)}
					<button
						type="button"
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
	/* a stepper: passed steps khaki, the current one navy, open ones neutral, untaken branches dashed */
	.state-bar {
		margin-top: 1.5rem;

		& .states {
			display: flex;
			list-style: none;

			& li {
				--marker: 1.75rem;

				position: relative;
				display: flex;
				flex: 1 1 0;
				flex-direction: column;
				gap: 0.5rem;
				min-width: 0;
				padding-right: 0.75rem;
				font-size: 13px;
				line-height: 1.35;
				overflow-wrap: anywhere;
				color: var(--ink3);

				/* the marker: empty ring by default */
				&::before {
					content: '';
					position: relative;
					z-index: 1;
					display: grid;
					place-items: center;
					flex: none;
					width: var(--marker);
					height: var(--marker);
					font-family: var(--mono);
					font-size: 12px;
					font-weight: 500;
					color: var(--ink3);
					background: var(--sheet);
					border: 1.5px solid var(--rule);
					border-radius: 50%;
				}

				/* the line to the next step */
				&::after {
					content: '';
					position: absolute;
					top: calc(var(--marker) / 2 - 1px);
					left: var(--marker);
					right: 0;
					height: 2px;
					background: var(--rule2);
				}

				&:last-child::after {
					display: none;
				}

				&[data-status='done'] {
					color: var(--ink2);

					&::before {
						content: '\2713';
						color: var(--on-khaki);
						background: var(--khaki);
						border-color: var(--khaki);
					}

					&::after {
						background: var(--khaki);
					}
				}

				/* a branch not taken: dashed and faded, never ticked */
				&[data-status='skipped'] {
					font-style: italic;
					opacity: 0.6;

					&::before {
						border-style: dashed;
					}
				}

				&[aria-current='step'] {
					font-weight: 600;
					color: var(--navy);

					&::before {
						color: var(--on-navy);
						background: var(--navy);
						border-color: var(--navy);
						box-shadow: 0 0 0 4px var(--navy-soft);
					}
				}
			}

			/* on phones the steps run downwards */
			@media (max-width: 40rem) {
				flex-direction: column;

				& li {
					flex-direction: row;
					align-items: center;
					gap: 0.75rem;
					padding: 0 0 0.85rem;

					&::after {
						top: var(--marker);
						bottom: 0;
						left: calc(var(--marker) / 2 - 1px);
						right: auto;
						width: 2px;
						height: auto;
					}

					&:last-child {
						padding-bottom: 0;
					}
				}
			}
		}

		& .visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		& .next {
			display: grid;
			gap: 0.6rem;
			margin-top: 1.25rem;
			padding-top: 1rem;
			border-top: 1px solid var(--rule2);

			& .missing {
				font-size: 13px;
				color: var(--ink2);
			}
		}

		@media print {
			box-shadow: none;
		}
	}
</style>
