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

<section class="history card">
	<h2 class="eyebrow">{m.records_history()}</h2>
	<ol>
		{#each events as event (event.id)}
			<li data-kind={event.kind}>
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
	/* a vertical timeline: a dot per event on a hairline, the kind in its colour */
	.history {
		margin-top: 2rem;

		& ol {
			list-style: none;
			margin-top: 1rem;
		}

		& li {
			--dot: var(--ink3);

			position: relative;
			display: grid;
			gap: 0.2rem;
			padding: 0 0 1.25rem 1.75rem;
			font-size: 14px;

			/* the line */
			&::before {
				content: '';
				position: absolute;
				top: 0.9rem;
				bottom: -0.3rem;
				left: calc(0.3rem - 1px);
				width: 2px;
				background: var(--rule2);
			}

			/* the dot */
			&::after {
				content: '';
				position: absolute;
				top: 0.3rem;
				left: 0;
				width: 0.6rem;
				height: 0.6rem;
				background: var(--sheet);
				border: 2px solid var(--dot);
				border-radius: 50%;
			}

			&:last-child {
				padding-bottom: 0;

				&::before {
					display: none;
				}
			}

			&[data-kind='created'],
			&[data-kind='assessment'] {
				--dot: var(--khaki);
			}

			&[data-kind='transition'] {
				--dot: var(--navy);
			}

			&[data-kind='archived'] {
				--dot: var(--wax);
			}

			& .when {
				font-family: var(--mono);
				font-size: 12px;
				color: var(--ink3);
			}

			& .what {
				font-weight: 500;
			}

			& .who {
				font-weight: 400;
				color: var(--ink3);
			}

			& .changes {
				display: grid;
				grid-template-columns: max-content 1fr;
				gap: 0.25rem 1rem;
				margin-top: 0.35rem;
				padding: 0.6rem 0.8rem;
				font-size: 13px;
				color: var(--ink2);
				background: var(--paper);
				border-radius: var(--radius);

				@media (max-width: 40rem) {
					grid-template-columns: minmax(0, 1fr);
					gap: 0.1rem;

					& dd + dt {
						margin-top: 0.4rem;
					}
				}

				& dt {
					color: var(--ink3);
				}

				& dd {
					min-width: 0;
					overflow-wrap: anywhere;
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

		@media print {
			box-shadow: none;
		}
	}
</style>
