<!--
	@component
	A result on paper: its level written out, headline and explanation, the
	reasons as a table with their legal basis, and duties and notes as a
	checklist. Part of the Prüfbericht and the Vorgangsblatt; no colour
	carries meaning.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '../i18n.js';
	import type { QuestionnaireResult } from '../types.js';

	let { result }: { result: QuestionnaireResult } = $props();

	const LEVEL = {
		negative: m.verdict_level_negative,
		conditional: m.verdict_level_conditional,
		positive: m.verdict_level_positive
	} as const;
</script>

<h2>{m.verdict_label()}</h2>
<p class="level">{m.verdict_scale({ level: LEVEL[result.verdict]() })}</p>
<p class="headline">{text(result.headline)}</p>
<p>{text(result.explanation)}</p>

{#if result.reasons.length > 0}
	<h2>{m.verdict_reasons()}</h2>
	<table class="print-table">
		<thead>
			<tr>
				<th class="number">{m.print_number()}</th>
				<th>{m.print_finding()}</th>
				<th class="basis">{m.print_basis()}</th>
			</tr>
		</thead>
		<tbody>
			{#each result.reasons as reason, index (index)}
				<tr>
					<td class="number">{index + 1}</td>
					<td>{text(reason.text)}</td>
					<td class="basis">{reason.cite ? cite(reason.cite) : '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

{#if (result.notes?.length ?? 0) > 0}
	<h2>{result.notesTitle ? text(result.notesTitle) : m.verdict_notes()}</h2>
	<ul class="print-checklist">
		{#each result.notes ?? [] as note, index (index)}
			<li>{text(note)}</li>
		{/each}
	</ul>
{/if}

<style>
	.level {
		margin: 0;
		font-size: 9pt;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.headline {
		margin: 1mm 0 2mm;
		font-family: var(--serif);
		font-size: 14pt;
	}
</style>
