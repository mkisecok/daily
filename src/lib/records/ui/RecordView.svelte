<!--
	@component
	A record read-only, section by section. Assessment fields show the frozen
	result and link to their questionnaire.
-->
<script lang="ts">
	import type { RoutePath } from '#lib/i18n/links.js';
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import { text } from '#lib/tools/i18n.js';
	import { formatValue } from '../format.js';
	import type { FieldDef, RecordToolDefinition, StoredRecord } from '../types.js';

	let {
		definition,
		record,
		assessHref
	}: {
		definition: RecordToolDefinition;
		record: StoredRecord;
		/** Route path to the questionnaire for an assessment field; resolved here. */
		assessHref: (field: FieldDef & { type: 'assessment' }) => RoutePath;
	} = $props();

	const locale = getLocale();
</script>

<div class="record-view">
	{#each definition.sections as section (section.id)}
		<section class="section">
			<h2>{text(section.title)}</h2>
			<dl>
				{#each section.fields as field (field.id)}
					{@const value = record.data[field.id]}
					<div class="row">
						<dt>
							{text(field.label)}
							{#if field.cite}<Citation basis={field.cite} />{/if}
						</dt>
						<dd>
							{#if field.type === 'assessment'}
								{#if value && typeof value === 'object' && !Array.isArray(value)}
									<span class="assessment" data-level={value.verdict}>{text(value.headline)}</span>
									<span class="assessed">{formatShortDate(value.at, locale)}</span>
								{:else}
									<span class="none">{m.records_assessment_none()}</span>
								{/if}
								{#if !record.archivedAt}
									<a class="assess no-print" href={resolve(assessHref(field))}>
										{value ? m.records_assessment_rerun() : m.records_assessment_run()} →
									</a>
								{/if}
							{:else}
								{formatValue(field, value, locale) || '—'}
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</section>
	{/each}
</div>

<style>
	.section {
		padding-top: 2rem;

		& h2 {
			font-size: 20px;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid var(--rule);
		}
	}

	.row {
		display: grid;
		grid-template-columns: minmax(12rem, 1fr) 2fr;
		gap: 0.25rem 2rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--rule2);

		@media (max-width: 40rem) {
			grid-template-columns: 1fr;
		}
	}

	dt {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 14px;
		color: var(--ink2);
	}

	dd {
		font-family: var(--serif);
		font-size: 16px;
		white-space: pre-line;
	}

	.assessment {
		display: block;

		&[data-level='positive'] {
			color: var(--wax);
		}

		&[data-level='conditional'] {
			color: var(--navy);
		}

		&[data-level='negative'] {
			color: var(--khaki);
		}
	}

	.assessed,
	.none {
		display: block;
		font-family: var(--sans);
		font-size: 13px;
		color: var(--ink3);
	}

	.assess {
		display: inline-block;
		margin-top: 0.35rem;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
