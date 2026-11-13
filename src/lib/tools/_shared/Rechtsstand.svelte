<!--
	@component
	The law a tool is based on: the version of each imported law it cites and
	whether a lawyer or data protection officer has reviewed it. Shown under
	the tool name and under the sources of every result, so a printed result
	says what it was based on. A saved result passes the versions stored with
	it; a law imported in a later version since is marked.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { rechtsstand } from '../rechtsstand.js';
	import type { LawAsOf, ToolManifest } from '../types.js';

	let { tool, stored }: { tool: ToolManifest; stored?: LawAsOf[] } = $props();

	const date = (iso: string) => formatShortDate(iso, getLocale());
	const laws = $derived(
		rechtsstand(tool, stored).map((law) => ({
			text:
				law.kind === 'consolidated'
					? m.rechtsstand_consolidated({ law: law.law, date: date(law.asOf) })
					: m.rechtsstand_amended({ law: law.law, date: date(law.asOf) }),
			newer: law.newer ? m.rechtsstand_newer({ date: date(law.newer) }) : null
		}))
	);
	const review = $derived(
		tool.reviewedAt
			? m.rechtsstand_reviewed({ date: date(tool.reviewedAt) })
			: m.rechtsstand_unreviewed()
	);
</script>

<p class="rechtsstand" data-reviewed={tool.reviewedAt ? 'true' : 'false'}>
	<span class="label">{m.rechtsstand_label()}:</span>
	{#each laws as law (law.text)}
		<span class="entry">
			{law.text}{#if law.newer}<em class="newer"> ({law.newer})</em>{/if}
		</span>
	{/each}
	<span class="entry review">{review}</span>
</p>

<style>
	.rechtsstand {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.5rem;
		margin: 0.6rem 0 0;
		color: var(--ink3);
		font-size: 0.8rem;
		line-height: 1.5;

		& .label {
			color: var(--ink2);
			font-weight: 600;
		}

		/* a middle dot after each entry but the last, so a wrapped line never starts with one */
		& .entry:not(:last-child)::after {
			margin-left: 0.5rem;
			content: '·';
		}

		& .newer {
			color: var(--risk-mid-ink);
		}

		&[data-reviewed='false'] .review {
			font-style: italic;
		}
	}
</style>
