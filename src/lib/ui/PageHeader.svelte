<!--
	@component
	Head of a page in the Arbeitsbereich: an optional trail of parent pages or
	an eyebrow, the serif title, an optional description, extra meta (status,
	citations) and actions on the right that wrap below on phones.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import type { RoutePath } from '#lib/i18n/links.js';

	let {
		title,
		eyebrow,
		trail = [],
		description,
		meta,
		actions
	}: {
		title: string;
		eyebrow?: string;
		/** parent pages, outermost first; the current page is the title */
		trail?: { label: string; path: RoutePath }[];
		description?: string;
		meta?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<header class="page-header">
	<div class="text">
		{#if trail.length > 0}
			<nav class="trail" aria-label="Breadcrumb">
				{#each trail as crumb (crumb.path)}
					<a href={resolve(crumb.path)}>{crumb.label}</a><span aria-hidden="true">/</span>
				{/each}
			</nav>
		{:else if eyebrow}
			<p class="eyebrow">{eyebrow}</p>
		{/if}
		<h1>{title}</h1>
		{#if description}<p class="description">{description}</p>{/if}
		{@render meta?.()}
	</div>
	{#if actions}
		<div class="actions toolbar">{@render actions()}</div>
	{/if}
</header>

<style>
	.page-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem 2rem;
		padding-bottom: 1.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--rule2);

		& .text {
			flex: 1 1 28rem;
			min-width: 0;
		}

		& .trail {
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem;
			margin-bottom: 0.4rem;
			font-size: 13px;
			color: var(--ink3);

			& a {
				color: var(--ink2);
			}
		}

		& .eyebrow {
			margin-bottom: 0.4rem;
		}

		& h1 {
			font-size: clamp(26px, 3.2vw, 32px);
			letter-spacing: -0.01em;
		}

		& .description {
			max-width: var(--measure);
			margin-top: 0.6rem;
			font-size: 16px;
			color: var(--ink2);
		}

		& .actions {
			flex: none;

			@media (max-width: 40rem) {
				flex: 1 1 100%;
			}
		}
	}
</style>
