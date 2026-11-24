<!--
	@component
	Loads what a processing activity's data flow is built from, the VVT
	entry and the AVV-Prüfung and TOM-Katalog entries that refer to it, and
	shows the flow. Given the entry itself (`record`, on the VVT page) it
	only loads those that refer to it; given only its id (`vvtId`, from a
	DSFA) it loads the entry too. Without a stored entry, as in a demo, it
	draws from the entry alone.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { getStore } from '../../records/store/index.js';
	import type { RecordView } from '../../records/types.js';
	import DataFlow from './DataFlow.svelte';
	import { dataFlow, type Linked } from './flow.js';

	type Entry = RecordView & { id?: string; title?: string };
	let { record, vvtId }: { record?: Entry; vvtId?: string } = $props();

	/** the VVT entry and the entries pointing to it, once loaded; null while loading */
	let loaded = $state<{ vvt: Entry; avv: Linked[]; tom: Linked[] } | null>(null);

	$effect(() => {
		const given = record;
		const id = given?.id ?? vvtId;
		loaded = null;
		let live = true;
		(async () => {
			const store = getStore();
			const vvt = given ?? (id ? ((await store.get(id))?.record ?? null) : null);
			if (!vvt) return;
			const linking = async (slug: string) =>
				id ? (await store.list(slug)).filter((entry) => entry.data.vvt === id) : [];
			const [avv, tom] = await Promise.all([linking('avv-pruefung'), linking('tom-katalog')]);
			if (live) loaded = { vvt, avv, tom };
		})().catch(() => {
			if (live && given) loaded = { vvt: given, avv: [], tom: [] };
		});
		return () => {
			live = false;
		};
	});

	const flow = $derived(loaded ? dataFlow(loaded.vvt, loaded.avv, loaded.tom, getLocale()) : null);
</script>

{#if flow && loaded}
	<DataFlow {flow} title={loaded.vvt.title ?? ''} />
{:else if record}
	<p class="loading no-print" role="status">{m.flow_loading()}</p>
{/if}

<style>
	.loading {
		margin: 0;
		font-size: 13px;
		color: var(--ink3);
	}
</style>
