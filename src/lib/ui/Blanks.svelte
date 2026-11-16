<!--
	@component
	A line of text whose places in square brackets, such as "[Meldeweg]", are
	marked as still to be filled in by the organisation: dashed underline on
	screen and on paper, so a placeholder never reads as finished text.
-->
<script lang="ts">
	let { value }: { value: string } = $props();

	const pieces = $derived(
		value
			.split(/(\[[^\]]+\])/)
			.filter(Boolean)
			.map((piece) => ({ piece, blank: piece.startsWith('[') }))
	);
</script>

{#each pieces as { piece, blank }, index (index)}{#if blank}<mark>{piece}</mark
		>{:else}{piece}{/if}{/each}

<style>
	mark {
		padding: 0 0.15em;
		font-style: italic;
		color: inherit;
		background: none;
		border-bottom: 1px dashed currentColor;
	}
</style>
