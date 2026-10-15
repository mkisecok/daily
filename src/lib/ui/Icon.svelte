<!--
	@component
	Outline icon drawn in the current text colour with a 1.5px stroke. Decorative
	unless `label` is given, then it is announced as an image with that name.
-->
<script lang="ts">
	import { ICONS, type IconName } from './icons.js';

	let { name, size = 18, label }: { name: IconName; size?: number; label?: string } = $props();
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	{#each ICONS[name] as d (d)}<path {d} />{/each}
</svg>

<style>
	.icon {
		flex: none;
		vertical-align: -0.2em;
	}
</style>
