<!--
	@component
	Site footer: legal links and the standing "no legal advice" line.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
</script>

<footer class="footer no-print">
	<div class="page inner">
		<span class="eyebrow">Daily · {m.site_tagline()}</span>
		<nav aria-label={m.footer_label()}>
			<a href={resolve(localized('/impressum'))}>{m.footer_imprint()}</a>
			<a href={resolve(localized('/datenschutz'))}>{m.footer_privacy()}</a>
		</nav>
		<span class="note">{m.footer_disclaimer()}</span>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--rule);
		padding: 1.5rem 0 2rem;
		font-size: 13px;
		color: var(--ink3);

		& .inner {
			display: flex;
			flex-wrap: wrap;
			gap: 1.5rem;
			align-items: baseline;

			& nav {
				display: flex;
				gap: 1.25rem;

				& a {
					color: var(--ink2);
				}
			}

			& .note {
				margin-left: auto;
				font-style: italic;
			}
		}
	}
</style>
