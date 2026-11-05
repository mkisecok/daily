<!--
	@component
	The four tiers of the AI Act as a pyramid with the system's tier picked
	out, from the result's outcome code. Systems outside the AI Act (not an AI
	system, out of scope) light no tier.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from '#lib/ui/Icon.svelte';
	import type { QuestionnaireResult } from '../types.js';

	let { result }: { result: QuestionnaireResult } = $props();

	type Tier = 'verboten' | 'hoch' | 'transparenz' | 'minimal';

	const TIERS: { id: Tier; label: () => string; basis: () => string }[] = [
		{ id: 'verboten', label: m.aiact_tier_verboten, basis: () => 'Art. 5' },
		{ id: 'hoch', label: m.aiact_tier_hoch, basis: () => 'Art. 6, Anhang III' },
		{ id: 'transparenz', label: m.aiact_tier_transparenz, basis: () => 'Art. 50' },
		{ id: 'minimal', label: m.aiact_tier_minimal, basis: m.aiact_none }
	];

	/** outcome codes of the classification engine, by tier */
	const OUTCOME_TIER: Record<string, Tier> = {
		verboten: 'verboten',
		hochrisiko: 'hoch',
		art50: 'transparenz',
		'art6-3': 'minimal',
		minimal: 'minimal'
	};

	const tier = $derived(result.outcome ? OUTCOME_TIER[result.outcome] : undefined);

	const ROW = 78;
	const MID = 220;
	/** a trapezoid per tier, widening downwards */
	const half = (row: number) => (90 + row * 85) / 2;
	const shape = (index: number) => {
		const top = index * ROW + 6;
		const bottom = (index + 1) * ROW;
		return `M${MID - half(index)},${top} L${MID + half(index)},${top} L${MID + half(index + 1)},${bottom} L${MID - half(index + 1)},${bottom} Z`;
	};
	const label = $derived(
		tier ? `${m.aiact_title()}: ${TIERS.find((t) => t.id === tier)!.label()}` : m.aiact_outside()
	);
</script>

<section class="pyramid card" aria-label={m.aiact_title()}>
	<h2><Icon name="stack-2" size={18} />{m.aiact_title()}</h2>
	<svg viewBox="0 0 540 320" role="img" aria-label={label}>
		{#each TIERS as item, index (item.id)}
			<g class="tier" data-tier={item.id} data-active={item.id === tier ? '' : undefined}>
				<path d={shape(index)} />
				<text class="name" x={MID} y={index * ROW + 40}>{item.label()}</text>
				<text class="basis" x={MID} y={index * ROW + 60}>{item.basis()}</text>
				{#if item.id === tier}
					<text class="yours" x={MID + half(index + 0.5) + 12} y={index * ROW + 46}
						>◀ {m.aiact_yours()}</text
					>
				{/if}
			</g>
		{/each}
	</svg>
	{#if !tier}<p class="outside">{m.aiact_outside()}</p>{/if}
</section>

<style>
	.pyramid {
		padding: 1.1rem 1.25rem;

		& h2 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.75rem;
			font-size: 17px;

			& :global(svg) {
				color: var(--primary);
			}
		}

		& svg {
			display: block;
			width: 100%;
			max-width: 30rem;
			margin-inline: auto;
			font-family: var(--sans);
		}
	}

	/* every tier faint; the system's tier solid, outlined and named */
	.tier {
		--fill: var(--risk-low);
		--on-fill: #fff;

		&[data-tier='verboten'] {
			--fill: var(--risk-high);
		}

		&[data-tier='hoch'] {
			--fill: var(--area-audit);
		}

		&[data-tier='transparenz'] {
			--fill: var(--risk-mid);
			--on-fill: #1c1b19;
		}

		& path {
			fill: var(--fill);
			opacity: 0.25;
		}

		& text {
			text-anchor: middle;
			fill: var(--ink);
		}

		& .name {
			font-size: 15px;
			font-weight: 700;
		}

		& .basis {
			font-size: 12px;
			fill: var(--ink2);
		}

		& .yours {
			font-size: 13px;
			font-weight: 700;
			text-anchor: start;
		}

		&[data-active] {
			& path {
				opacity: 1;
				stroke: var(--ink);
				stroke-width: 3;
			}

			& .name,
			& .basis {
				fill: var(--on-fill);
			}

			& .name {
				font-size: 17px;
			}
		}
	}

	/* the dark theme's tier colours are light; their text turns dark */
	:global(html[data-theme='dark']) .tier {
		--on-fill: #0e1014;
	}

	.outside {
		margin-top: 0.5rem;
		font-size: 14px;
		color: var(--ink2);
		text-align: center;
	}
</style>
