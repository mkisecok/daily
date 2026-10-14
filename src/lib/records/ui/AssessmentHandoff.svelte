<!--
	@component
	On a questionnaire opened from a record (`?fuer=<tool>:<record>:<field>`):
	names the record and, once there is a result, attaches it to the record's
	assessment field, together with the values the record tool derives.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import { getRecordTool } from '#lib/tools/registry.js';
	import type { QuestionnaireResult } from '#lib/tools/types.js';
	import { getStore } from '../store/index.js';
	import type { RecordTool, StoredRecord } from '../types.js';
	import { fieldById } from '../validate.js';

	let {
		questionnaire,
		catalogVersion,
		result
	}: { questionnaire: string; catalogVersion: number; result: QuestionnaireResult | null } =
		$props();

	type Target = { tool: RecordTool; id: string; field: string; record: StoredRecord };
	let target = $state<Target | null>(null);
	let busy = $state(false);
	let failed = $state(false);

	// The query string is read in the browser only: the page is prerendered.
	onMount(async () => {
		const [slug, id, field] = (page.url.searchParams.get('fuer') ?? '').split(':');
		const tool = getRecordTool(slug ?? '');
		const def = tool && field ? fieldById(tool.definition, field) : undefined;
		if (!tool || !id || def?.type !== 'assessment' || def.tool !== questionnaire) return;
		const detail = await getStore()
			.get(id)
			.catch(() => null);
		if (!detail || detail.record.archivedAt) return;
		target = { tool, id, field: def.id, record: detail.record };
	});

	async function attach() {
		if (!target || !result) return;
		const { tool, id, field, record } = target;
		busy = true;
		failed = false;
		try {
			const outcome = await getStore().attachAssessment(
				id,
				field,
				{
					tool: questionnaire,
					catalogVersion,
					verdict: result.verdict,
					...(result.outcome ? { outcome: result.outcome } : {}),
					headline: result.headline,
					at: new Date().toISOString()
				},
				tool.engine.fromAssessment?.(field, result, record) ?? {}
			);
			if (!outcome.ok) throw new Error(outcome.error);
			await goto(resolve(localized(`/werkzeuge/${tool.manifest.slug}/eintraege?eintrag=${id}`)));
		} catch {
			failed = true;
		} finally {
			busy = false;
		}
	}
</script>

{#if target}
	<aside class="handoff no-print">
		<p>{m.handoff_for({ title: target.record.title, tool: text(target.tool.manifest.name) })}</p>
		{#if result}
			<p class="toolbar">
				<button type="button" onclick={attach} disabled={busy}>
					{m.handoff_attach({ tool: text(target.tool.manifest.name) })}
				</button>
			</p>
		{/if}
		{#if failed}<p class="failed" role="alert">{m.handoff_failed()}</p>{/if}
	</aside>
{/if}

<style>
	.handoff {
		display: grid;
		gap: 0.75rem;
		margin-top: 1.5rem;
		padding: 0.9rem 1rem;
		border-left: 3px solid var(--navy);
		background: var(--navy-soft);
		font-size: 14px;
	}

	.failed {
		color: var(--wax);
	}
</style>
