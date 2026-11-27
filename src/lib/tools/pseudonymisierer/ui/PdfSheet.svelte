<!--
	@component
	One PDF page as the reader sees it: the page drawn by pdf.js, the found
	and marked values as tinted boxes over it, and a box the user draws with
	the pointer, handed back as the stretch of text it covers. A click on a
	tinted box, or Enter on it, switches the value off or removes the mark.
-->
<script lang="ts">
	import type { PDFDocumentProxy } from 'pdfjs-dist';
	import { m } from '#lib/paraglide/messages.js';
	import { drawPage } from '../document/pdf.js';
	import { lineRects, rangeInBox, type Glyph, type Rect } from '../document/pdf-layout.js';
	import { TOKEN_TIER } from '../rules.js';
	import type { Span } from '../types.js';

	let {
		doc,
		index,
		size,
		origins,
		spans,
		pending = null,
		onrange,
		ontoggle
	}: {
		doc: PDFDocumentProxy;
		/** the page, from 0 */
		index: number;
		/** the page's size in points */
		size: { width: number; height: number };
		origins: (Glyph | null)[];
		spans: Span[];
		pending?: { start: number; end: number } | null;
		onrange: (start: number, end: number, via: 'box') => void;
		ontoggle: (value: string) => void;
	} = $props();

	let width = $state(0);

	/** a box on the page as a share of its size, so it scales with the picture */
	const place = (rect: Rect) => ({
		left: `${(rect.x / size.width) * 100}%`,
		top: `${(rect.y / size.height) * 100}%`,
		width: `${(rect.w / size.width) * 100}%`,
		height: `${(rect.h / size.height) * 100}%`
	});

	const marks = $derived(
		spans.flatMap((span) =>
			lineRects(origins, span.start, span.end)
				.filter((line) => line.page === index)
				.map((line, n) => ({ span, line, first: n === 0 }))
		)
	);
	const waiting = $derived(
		pending
			? lineRects(origins, pending.start, pending.end).filter((line) => line.page === index)
			: []
	);

	/** draws the page sharp at the size it is shown, again when that size changes */
	function picture(canvas: HTMLCanvasElement) {
		if (!width) return;
		const scale = (width / size.width) * (window.devicePixelRatio || 1);
		const task = drawPage(doc, index, canvas, scale);
		return () => task.cancel();
	}

	/** the box being drawn, in points */
	let box = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

	function toPoints(event: PointerEvent, frame: DOMRect) {
		return {
			x: ((event.clientX - frame.left) / frame.width) * size.width,
			y: ((event.clientY - frame.top) / frame.height) * size.height
		};
	}

	function start(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (event.button !== 0 || (event.target as Element).closest('.anon-mark')) return;
		const { x, y } = toPoints(event, event.currentTarget.getBoundingClientRect());
		box = { x0: x, y0: y, x1: x, y1: y };
		// a demo's drawn box has no real pointer to capture
		if (event.isTrusted) event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function move(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!box) return;
		const { x, y } = toPoints(event, event.currentTarget.getBoundingClientRect());
		box = { ...box, x1: x, y1: y };
	}

	function end() {
		if (!box) return;
		const drawn: Rect = {
			page: index,
			x: Math.min(box.x0, box.x1),
			y: Math.min(box.y0, box.y1),
			w: Math.abs(box.x1 - box.x0),
			h: Math.abs(box.y1 - box.y0)
		};
		box = null;
		if (drawn.w < 2 && drawn.h < 2) return;
		const range = rangeInBox(origins, drawn);
		if (range) onrange(range.start, range.end, 'box');
	}
</script>

<div
	class="pdf-sheet"
	style:aspect-ratio="{size.width} / {size.height}"
	bind:clientWidth={width}
	role="group"
	aria-label={m.anon_doc_sheet({ n: String(index + 1) })}
	onpointerdown={start}
	onpointermove={move}
	onpointerup={end}
	onpointercancel={() => (box = null)}
>
	<canvas {@attach picture}></canvas>
	{#each marks as { span, line, first } (`${span.id}-${line.start}`)}
		{@const at = place(line)}
		<span
			role="button"
			tabindex={first ? 0 : -1}
			aria-hidden={first ? undefined : 'true'}
			aria-pressed={!span.muted}
			aria-label={first ? `${span.value} → ${span.replacement ?? '—'}` : undefined}
			class="anon-mark"
			data-anon-tier={TOKEN_TIER[span.type]}
			title={span.muted ? undefined : span.replacement}
			style:left={at.left}
			style:top={at.top}
			style:width={at.width}
			style:height={at.height}
			onclick={() => ontoggle(span.value)}
			onkeydown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return;
				event.preventDefault();
				ontoggle(span.value);
			}}
		></span>
	{/each}
	{#each waiting as line (line.start)}
		{@const at = place(line)}
		<span
			class="pending"
			aria-hidden="true"
			style:left={at.left}
			style:top={at.top}
			style:width={at.width}
			style:height={at.height}
		></span>
	{/each}
	{#if box}
		{@const at = place({
			page: index,
			x: Math.min(box.x0, box.x1),
			y: Math.min(box.y0, box.y1),
			w: Math.abs(box.x1 - box.x0),
			h: Math.abs(box.y1 - box.y0)
		})}
		<span
			class="box"
			aria-hidden="true"
			style:left={at.left}
			style:top={at.top}
			style:width={at.width}
			style:height={at.height}
		></span>
	{/if}
</div>

<style>
	.pdf-sheet {
		position: relative;
		width: 100%;
		background: #fff;
		box-shadow: 0 1px 4px rgb(0 0 0 / 18%);
		cursor: crosshair;
		user-select: none;
		/* a drag draws a box; two fingers still zoom */
		touch-action: pinch-zoom;

		& canvas {
			display: block;
			width: 100%;
			height: 100%;
		}

		& > span {
			position: absolute;
		}

		/* over the page a mark is a tinted box, the page's own text shows through */
		& .anon-mark {
			padding: 0;
			background: color-mix(in srgb, var(--tier) 22%, transparent);
			border-bottom-width: 2px;
			border-radius: 2px;

			&[aria-pressed='false'] {
				background: none;
				border-bottom-style: dashed;
			}
		}

		& .pending {
			background: color-mix(in srgb, var(--primary) 18%, transparent);
			outline: 1px dashed var(--primary);
		}

		& .box {
			background: color-mix(in srgb, var(--primary) 12%, transparent);
			border: 2px solid var(--primary);
			border-radius: 3px;
			pointer-events: none;
		}
	}
</style>
