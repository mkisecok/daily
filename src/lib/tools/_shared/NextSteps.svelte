<!--
	@component
	What usually follows a questionnaire result: one line per suggested tool
	with its name, why, and whether it is a check or a new entry. Nothing is
	shown when the result suggests nothing. Not printed.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { text } from '../i18n.js';
	import { toolIcon } from '../icons.js';
	import { nextSteps } from '../next.js';
	import { getTool } from '../registry.js';
	import type { QuestionnaireResult } from '../types.js';

	let { tool, result }: { tool: string; result: QuestionnaireResult } = $props();

	const steps = $derived(
		nextSteps(tool, result).flatMap((step) => {
			const target = getTool(step.tool);
			return target ? [{ ...step, name: text(target.name) }] : [];
		})
	);

	const href = (step: { tool: string; mode: 'pruefen' | 'neu' }) =>
		resolve(
			localized(
				step.mode === 'pruefen'
					? `/werkzeuge/${step.tool}/pruefen`
					: `/werkzeuge/${step.tool}/eintraege?neu=1`
			)
		);
</script>

{#if steps.length > 0}
	<section class="next no-print" aria-labelledby="next-title">
		<h2 id="next-title">{m.next_title()}</h2>
		<ul>
			{#each steps as step (step.tool)}
				<li>
					<span class="icon" aria-hidden="true"><Icon name={toolIcon(step.tool)} size={18} /></span>
					<span class="body">
						<a href={href(step)}>{step.name}</a>
						<span class="why">{text(step.why)}</span>
					</span>
					<span class="mode">{step.mode === 'pruefen' ? m.next_check() : m.next_entry()} →</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	/* a short list under the result, in its hairline style */
	.next {
		margin-top: 1.5rem;
		padding: 1.25rem 1.75rem 1.25rem;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: 4px;

		@media (max-width: 40rem) {
			padding: 1rem;
		}

		& h2 {
			font-size: 16px;
		}

		& ul {
			margin-top: 0.5rem;
			list-style: none;
		}

		& li {
			position: relative;
			display: grid;
			grid-template-columns: 1.5rem minmax(0, 1fr) auto;
			gap: 0.75rem;
			align-items: center;
			padding: 0.65rem 0;
			border-top: 1px solid var(--rule2);

			&:first-child {
				border-top: 0;
			}
		}

		& .icon {
			display: grid;
			place-items: center;
			color: var(--primary);
		}

		& .body {
			display: grid;
			min-width: 0;
		}

		/* the whole row is the link's target */
		& a {
			font-family: var(--serif);
			font-size: 15px;
			font-weight: 600;
			color: var(--ink);

			&::after {
				position: absolute;
				inset: 0;
				content: '';
			}

			&:hover {
				text-decoration: underline;
			}
		}

		& .why {
			font-size: 13px;
			color: var(--ink2);
		}

		& .mode {
			font-size: 12px;
			white-space: nowrap;
			color: var(--ink3);
		}
	}
</style>
