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
	import { formatValue, type Titles } from '../format.js';
	import type { FieldDef, RecordToolDefinition, StoredRecord } from '../types.js';

	let {
		definition,
		record,
		assessHref = undefined,
		titles = {},
		referenceHref = undefined
	}: {
		definition: RecordToolDefinition;
		record: StoredRecord;
		/** route path to the questionnaire for an assessment field; resolved here. Omit for read-only views. */
		assessHref?: (field: FieldDef & { type: 'assessment' }) => RoutePath;
		/** titles of referenced records by id */
		titles?: Titles;
		/** route path to a referenced record; resolved here */
		referenceHref?: (tool: string, id: string) => RoutePath;
	} = $props();

	const locale = getLocale();
</script>

<div class="record-view card">
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
								{#if !record.archivedAt && assessHref}
									<a class="assess no-print" href={resolve(assessHref(field))}>
										{value ? m.records_assessment_rerun() : m.records_assessment_run()} →
									</a>
								{/if}
							{:else if field.type === 'reference' && typeof value === 'string' && referenceHref}
								<a href={resolve(referenceHref(field.tool, value))}
									>{formatValue(field, value, locale, titles)}</a
								>
							{:else}
								{formatValue(field, value, locale, titles) || '—'}
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</section>
	{/each}
</div>

<style>
	/* one raised card; each section a titled block of label/value rows */
	.record-view {
		margin-top: 1.5rem;
		padding: 0;

		& .section {
			padding: 1rem 1.25rem 0.5rem;

			& + .section {
				border-top: 1px solid var(--rule2);
			}

			& h2 {
				font-size: 18px;
				padding-bottom: 0.35rem;
			}
		}

		& .row {
			display: grid;
			grid-template-columns: minmax(10rem, 1fr) 2fr;
			gap: 0.25rem 2rem;
			padding: 0.65rem 0;
			border-top: 1px solid var(--rule2);

			@media (max-width: 40rem) {
				grid-template-columns: minmax(0, 1fr);
			}

			& dt {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: 0.15rem;
				font-size: 13px;
				color: var(--ink3);
			}

			& dd {
				min-width: 0;
				font-size: 15px;
				white-space: pre-line;
				overflow-wrap: anywhere;

				& .assessment {
					display: block;
					font-weight: 600;

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

				& .assessed,
				& .none {
					display: block;
					font-size: 13px;
					color: var(--ink3);
				}

				& .assess {
					display: inline-block;
					margin-top: 0.35rem;
					font-size: 13px;
					font-weight: 500;
				}
			}
		}

		@media print {
			box-shadow: none;
		}
	}
</style>
