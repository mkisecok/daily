<!--
	@component
	Thin bar above the masthead in the static preview: says what is switched
	off and links to the explanation page.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import Icon from './Icon.svelte';
</script>

<p class="notice no-print">
	<span class="page inner">
		<Icon name="eye" size={16} />
		<span class="text">{m.preview_notice()}</span>
		<a href={resolve(localized('/vorschau'))}>{m.preview_more()} →</a>
	</span>
</p>

<style>
	.notice {
		font-size: 13px;
		color: var(--ink2);
		background: var(--sheet);
		border-bottom: 1px solid var(--rule);
		box-shadow: inset 3px 0 0 var(--navy);

		& .inner {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.25rem 0.6rem;
			padding-top: 0.45rem;
			padding-bottom: 0.45rem;
			color: var(--navy);
		}

		& .text {
			flex: 1 1 20rem;
			color: var(--ink2);
		}

		& a {
			white-space: nowrap;
		}
	}
</style>
