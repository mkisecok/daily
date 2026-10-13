<!--
	@component
	Light / dark paper toggle. Writes `<html data-theme>` and a one-year cookie
	so the next server render matches.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { THEME_COOKIE, type Theme, type ThemeSetting } from '#lib/theme.js';

	let { initial }: { initial: ThemeSetting } = $props();

	// Deliberately captures the server-rendered value once; after hydration the
	// attachment below reads what the inline script in app.html resolved
	// ('auto' becomes light or dark there), and toggle() owns it from then on.
	// svelte-ignore state_referenced_locally
	let theme = $state<Theme>(initial === 'dark' ? 'dark' : 'light');

	function syncFromDocument(element: HTMLElement) {
		const resolved = element.ownerDocument.documentElement.dataset.theme;
		if (resolved === 'dark' || resolved === 'light') theme = resolved;
	}

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
	}
</script>

<button
	type="button"
	class="switch"
	onclick={toggle}
	aria-label={theme === 'dark' ? m.theme_to_light() : m.theme_to_dark()}
	title={theme === 'dark' ? m.theme_to_light() : m.theme_to_dark()}
	{@attach syncFromDocument}
>
	{#if theme === 'dark'}
		<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
			<circle cx="10" cy="10" r="3.5" />
			<path
				d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
			<path d="M16.5 12.6A7 7 0 0 1 7.4 3.5a7 7 0 1 0 9.1 9.1Z" />
		</svg>
	{/if}
</button>

<style>
	.switch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: var(--ink3);

		&:hover {
			color: var(--ink);
		}

		& svg {
			fill: none;
			stroke: currentColor;
			stroke-width: 1.25;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
	}
</style>
