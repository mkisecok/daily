<!--
	@component
	Thin bar above the masthead in the static preview: says what is switched
	off and links to the explanation page.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
</script>

<p class="notice no-print">
	<span class="page inner">
		<span>{m.preview_notice()}</span>
		<a href={resolve(localized('/vorschau'))}>{m.preview_more()} →</a>
	</span>
</p>

<style>
	.notice {
		background: var(--navy-soft);
		border-bottom: 1px solid var(--rule);
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		color: var(--ink2);

		& .inner {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 1rem;
			padding-top: 0.45rem;
			padding-bottom: 0.45rem;
		}
	}
</style>
