<!--
	@component
	The DAILY wordmark. Four letters, three colours: D navy (data), AI wax
	(artificial intelligence), L khaki (law), Y ink (yield). Serif, no icon.
-->
<script lang="ts">
	let { size = 'masthead' }: { size?: 'masthead' | 'hero' } = $props();
</script>

<span class="wordmark" data-size={size} role="img" aria-label="Daily">
	<span class="d">D</span><span class="ai">AI</span><span class="l">L</span><span class="y">Y</span>
</span>

<style>
	.wordmark {
		font-family: var(--serif);
		font-weight: 600;
		letter-spacing: 0.01em;
		line-height: 1;
		white-space: nowrap;
		user-select: none;

		&[data-size='masthead'] {
			font-size: 26px;
		}

		&[data-size='hero'] {
			font-size: clamp(64px, 12vw, 128px);
			letter-spacing: 0.02em;
		}

		& .d {
			color: var(--navy);
		}

		& .ai {
			color: var(--wax);
		}

		& .l {
			color: var(--khaki);
		}

		& .y {
			color: var(--ink);
		}
	}
</style>
