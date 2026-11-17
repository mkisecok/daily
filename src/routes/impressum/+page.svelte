<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>{m.footer_imprint()} — Daily</title>
</svelte:head>

<PageHeader title={m.footer_imprint()} />

<article class="legal card">
	<p><span class="badge navy">{m.placeholder_building()}</span></p>
</article>

<style>
	/* reading width for the legal text once it is in place */
	.legal {
		max-width: var(--measure);
		font-size: 15.5px;
		line-height: 1.7;
	}
</style>
