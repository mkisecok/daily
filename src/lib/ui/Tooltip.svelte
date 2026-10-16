<!--
	@component
	Short explanation shown above its trigger on hover and on keyboard focus,
	closed by leaving, blurring or Esc. The bubble lives in the top layer
	(popover), so no container clips it; its position is measured on show.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { on } from 'svelte/events';

	let { text, children }: { text: string; children: Snippet } = $props();

	const id = $props.id();
	// DOM references and the open flag never reach the markup, so they are plain variables
	let anchor: HTMLElement | undefined;
	let bubble: HTMLElement | undefined;
	let shown = false;

	/** above the trigger when there is room, below otherwise, kept inside the viewport */
	function place() {
		if (!anchor || !bubble) return;
		const a = anchor.getBoundingClientRect();
		const b = bubble.getBoundingClientRect();
		const gap = 8;
		const above = a.top - b.height - gap;
		const top = above >= 4 ? above : a.bottom + gap;
		const left = Math.min(
			Math.max(4, a.left + a.width / 2 - b.width / 2),
			window.innerWidth - b.width - 4
		);
		bubble.style.top = `${top}px`;
		bubble.style.left = `${left}px`;
	}

	function show() {
		if (!bubble || shown) return;
		bubble.showPopover();
		shown = true;
		place();
	}

	function hide() {
		if (!bubble || !shown) return;
		bubble.hidePopover();
		shown = false;
	}

	function escape(event: KeyboardEvent) {
		if (event.key === 'Escape') hide();
	}

	/**
	 * hover and keyboard focus on the trigger; listeners go when the element does.
	 * The description goes on the focusable element inside, because screen readers
	 * announce the description of what has focus, not of its wrapper.
	 */
	function trigger(node: HTMLElement) {
		anchor = node;
		const focusable =
			node.querySelector<HTMLElement>('a[href], button, input, select, textarea, [tabindex]') ??
			node;
		focusable.setAttribute('aria-describedby', `${id}-tip`);
		const offs = [
			on(node, 'pointerenter', show),
			on(node, 'pointerleave', hide),
			on(node, 'focusin', show),
			on(node, 'focusout', hide)
		];
		return () => offs.forEach((off) => off());
	}

	function tip(node: HTMLElement) {
		bubble = node;
	}
</script>

<svelte:document onkeydown={escape} />

<span {@attach trigger} class="anchor">{@render children()}</span>
<span {@attach tip} id="{id}-tip" class="tip" popover="manual" role="tooltip">{text}</span>

<style>
	/* inline-flex keeps the trigger a flex item, so its own max-width and ellipsis still apply */
	.anchor {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
	}

	.tip {
		position: fixed;
		inset: auto;
		max-width: 18rem;
		margin: 0;
		padding: 0.4rem 0.6rem;
		font-family: var(--sans);
		font-size: 12px;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: normal;
		text-transform: none;
		color: var(--sheet);
		background: var(--ink);
		border: 0;
		border-radius: var(--radius-badge);
		box-shadow: var(--shadow-float);
		pointer-events: none;
	}
</style>
