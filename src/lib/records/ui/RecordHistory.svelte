<!--
	@component
	The record's history, oldest first: when, who, what. Field changes show
	old and new value; status changes the two states.
-->
<script lang="ts">
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import { formatValue, stateLabel, type Titles } from '../format.js';
	import type { RecordEvent, RecordToolDefinition } from '../types.js';
	import { fieldById } from '../validate.js';

	let {
		definition,
		events,
		titles = {}
	}: { definition: RecordToolDefinition; events: RecordEvent[]; titles?: Titles } = $props();

	const locale = getLocale();
	const kinds: Record<RecordEvent['kind'], () => string> = {
		created: m.records_event_created,
		updated: m.records_event_updated,
		transition: m.records_event_transition,
		assessment: m.records_event_assessment,
		archived: m.records_event_archived
	};

	function changesOf(event: RecordEvent) {
		// creation lists every filled field; the record itself shows them
		if (event.kind === 'created' || !event.changes) return [];
		return Object.entries(event.changes).flatMap(([id, [before, after]]) => {
			const field = fieldById(definition, id);
			if (!field) return [];
			return [
				{
					id,
					label: text(field.label),
					before: formatValue(field, before, locale, titles) || '—',
					after: formatValue(field, after, locale, titles) || '—'
				}
			];
		});
	}
</script>

<section class="history">
	<h2 class="eyebrow">{m.records_history()}</h2>
	<ol>
		{#each events as event (event.id)}
			<li>
				<span class="when">{formatShortDate(event.at, locale)} {formatTime(event.at, locale)}</span>
				<span class="what">
					{kinds[event.kind]()}{#if event.kind === 'transition'}:
						{stateLabel(definition, event.fromState, locale)} → {stateLabel(
							definition,
							event.toState,
							locale
						)}{/if}{#if event.author}<span class="who"> · {event.author}</span>{/if}
				</span>
				{#if changesOf(event).length > 0}
					<dl class="changes">
						{#each changesOf(event) as change (change.id)}
							<dt>{change.label}</dt>
							<dd><del>{change.before}</del> → <ins>{change.after}</ins></dd>
						{/each}
					</dl>
				{/if}
			</li>
		{/each}
	</ol>
</section>

<style>
	.history {
		padding: 2rem 0;

		& ol {
			list-style: none;
			margin-top: 0.75rem;
		}

		& li {
			display: grid;
			grid-template-columns: 9.5rem 1fr;
			gap: 0.25rem 1rem;
			padding: 0.6rem 0;
			border-bottom: 1px solid var(--rule2);
			font-size: 14px;

			@media (max-width: 40rem) {
				grid-template-columns: 1fr;
			}

			& .when {
				font-family: var(--mono);
				font-size: 12px;
				color: var(--ink3);
			}

			& .who {
				color: var(--ink3);
			}

			& .changes {
				grid-column: 2;
				display: grid;
				grid-template-columns: max-content 1fr;
				gap: 0.2rem 1rem;
				font-size: 13px;
				color: var(--ink2);

				@media (max-width: 40rem) {
					grid-column: 1;
				}

				& dt {
					color: var(--ink3);
				}

				& del {
					color: var(--ink3);
				}

				& ins {
					text-decoration: none;
					color: var(--ink);
				}
			}
		}
	}
</style>
