<!--
	@component
	The layer of a running tool demo, above the page: a cursor and a ring
	around what the demo points at, its caption with the time used, and at the
	end of a record demo the entry as it would look once saved. While it runs,
	clicks on the page do nothing and Escape ends it; at the end it offers to
	try the tool or to close. Mounted once in the root layout.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { titleOf } from '#lib/records/validate.js';
	import type { StoredRecord } from '#lib/records/types.js';
	import RecordView from '#lib/records/ui/RecordView.svelte';
	import { recordDashboards } from '../../dashboards.js';
	import { text } from '../../i18n.js';
	import { getRecordTool } from '../../registry.js';
	import Verdict from '../Verdict.svelte';
	import { demo, DEMO_MS } from './demo.svelte.js';

	/** the entry the demo would save, never stored */
	const shown = $derived.by(() => {
		if (!demo.result) return null;
		const recordTool = getRecordTool(demo.result.slug);
		if (!recordTool) return null;
		const { definition, engine } = recordTool;
		const now = new Date().toISOString();
		const record: StoredRecord = {
			id: 'vorfuehrung',
			toolSlug: definition.slug,
			definitionVersion: definition.version,
			state: definition.workflow?.initialState ?? null,
			title: titleOf(definition, demo.result.data),
			data: demo.result.data,
			version: 1,
			createdAt: now,
			updatedAt: now,
			archivedAt: null
		};
		return {
			recordTool,
			record,
			assessment: engine.assess?.(record) ?? null,
			Dashboard: recordDashboards[definition.slug]
		};
	});

	const seconds = Math.round(DEMO_MS / 1000);

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && demo.active) {
			event.preventDefault();
			demo.end();
		}
	}
</script>

<svelte:window {onkeydown} onscroll={() => demo.track()} onresize={() => demo.track()} />

{#if demo.active}
	<div class="demo-layer" data-phase={demo.phase}>
		<!-- the page stays visible but out of reach while the demo plays it -->
		{#if demo.phase === 'running'}<div class="shield" aria-hidden="true"></div>{/if}

		{#if demo.ring}
			<div
				class="ring"
				aria-hidden="true"
				style:top="{demo.ring.top - 6}px"
				style:left="{demo.ring.left - 6}px"
				style:width="{demo.ring.width + 12}px"
				style:height="{demo.ring.height + 12}px"
			></div>
		{/if}

		{#if demo.cursor && demo.phase === 'running'}
			<svg
				class="cursor"
				aria-hidden="true"
				viewBox="0 0 24 24"
				width="26"
				height="26"
				style:transform="translate({demo.cursor.x}px, {demo.cursor.y}px)"
			>
				<path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.4 13.7 L17.5 13.4 Z" />
			</svg>
		{/if}

		{#if shown}
			<section class="demo-result" aria-label={m.demo_result_title()}>
				<div class="sheet">
					<p class="eyebrow">{m.demo_result_title()}</p>
					<h2>{shown.record.title}</h2>
					{#if shown.assessment}
						<Verdict result={shown.assessment} tool={shown.recordTool.manifest} />
					{/if}
					{#if shown.Dashboard}<shown.Dashboard record={shown.record} />{/if}
					<RecordView definition={shown.recordTool.definition} record={shown.record} />
				</div>
			</section>
		{/if}

		<div class="caption card" role="status" aria-live="polite">
			<p class="eyebrow">
				{m.demo_label()}{#if demo.tool}
					· {text(demo.tool.name)}{/if}
			</p>
			{#if demo.phase === 'done'}
				<p class="text">{m.demo_done()}</p>
				<div class="toolbar">
					<button type="button" onclick={() => demo.end(demo.tryHref)}>{m.demo_try()} →</button>
					<button type="button" class="quiet" onclick={() => demo.end()}>{m.demo_close()}</button>
				</div>
			{:else}
				<p class="text">{demo.caption}</p>
				<div class="foot">
					<span class="meter" aria-hidden="true"
						><span style:width="{demo.elapsed * 100}%"></span></span
					>
					<span class="time">{Math.round(demo.elapsed * seconds)}s / {seconds}s</span>
					<button type="button" class="button quiet" onclick={() => demo.end()}
						>{m.demo_stop()}</button
					>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.demo-layer {
		position: fixed;
		inset: 0;
		z-index: 80;
		pointer-events: none;

		& .shield {
			position: absolute;
			inset: 0;
			pointer-events: auto;
		}

		& .ring {
			position: fixed;
			border: 2px solid var(--primary);
			border-radius: 10px;
			box-shadow: 0 0 0 5px color-mix(in srgb, var(--primary) 22%, transparent);
			transition:
				top 0.45s ease,
				left 0.45s ease,
				width 0.45s ease,
				height 0.45s ease;
		}

		& .cursor {
			position: fixed;
			top: 0;
			left: 0;
			transition: transform 0.6s cubic-bezier(0.3, 0.7, 0.2, 1);
			filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));

			& path {
				fill: var(--ink);
				stroke: var(--sheet);
				stroke-width: 1.4;
				stroke-linejoin: round;
			}
		}

		/* the saved entry, as a sheet over the form */
		& .demo-result {
			position: fixed;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 9rem 16px 1.5rem;
			pointer-events: auto;
			background: color-mix(in srgb, var(--ink) 30%, transparent);

			& .sheet {
				width: min(100%, 46rem);
				max-height: 100%;
				overflow: auto;
				padding: var(--card-pad-sheet);
				background: var(--paper);
				border-radius: var(--radius);
				box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
			}

			& h2 {
				margin-bottom: 1rem;
			}
		}

		& .caption {
			position: fixed;
			top: 0.75rem;
			left: 50%;
			width: min(calc(100% - 32px), 34rem);
			padding: 0.8rem 1rem;
			pointer-events: auto;
			transform: translateX(-50%);
			box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);

			& .eyebrow {
				margin: 0 0 0.2rem;
			}

			& .text {
				min-height: 1.5em;
				margin: 0;
				font-size: 15px;
				font-weight: 500;
			}

			& .foot {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				margin-top: 0.6rem;
			}

			& .meter {
				flex: 1;
				height: 4px;
				overflow: hidden;
				background: var(--rule2);
				border-radius: 2px;

				& span {
					display: block;
					height: 100%;
					background: var(--primary);
					transition: width 0.2s linear;
				}
			}

			& .time {
				font-size: 12px;
				font-variant-numeric: tabular-nums;
				color: var(--ink3);
			}

			& .toolbar {
				margin-top: 0.75rem;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.demo-layer {
			& .ring,
			& .cursor {
				transition: none;
			}
		}
	}
</style>
