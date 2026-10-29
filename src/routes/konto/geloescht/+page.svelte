<!--
	Keycloak returns here after its "Delete account" step. Daily has already
	deleted the user's data before handing over, so this page only confirms.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>{m.account_deleted_title()} — Daily</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<PageHeader title={m.account_deleted_title()} />

<article class="card measure done">
	<p>{m.account_deleted_body()}</p>
	<p>{m.account_deleted_backups()}</p>
	<p>{m.account_deleted_cancelled()}</p>
	<p class="toolbar">
		<a class="button" href={resolve(localized('/'))}>{m.account_deleted_home()}</a>
	</p>
</article>

<style>
	.done {
		display: grid;
		gap: 0.75rem;
		padding: 1.5rem 1.75rem;
		font-size: 15.5px;
		line-height: 1.6;
	}
</style>
