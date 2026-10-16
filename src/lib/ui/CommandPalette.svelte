<!--
	@component
	Command palette ("Suchen oder springen"): areas, all tools and a few
	actions, ranked as you type; Enter or a click jumps there. Opens with
	Ctrl/⌘+K anywhere and with "/" outside text fields; Esc and the backdrop
	close it. Built on Bits UI Command in a native `<dialog>`.
-->
<script lang="ts">
	import { Command } from 'bits-ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { localized, type RoutePath } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '#lib/tools/i18n.js';
	import { tools } from '#lib/tools/registry.js';
	import Icon from './Icon.svelte';
	import type { IconName } from './icons.js';
	import { score } from './command.js';
	import { navItems } from './nav.js';

	let { open = $bindable(false), withRecords }: { open?: boolean; withRecords: boolean } = $props();

	type Entry = {
		id: string;
		group: string;
		label: string;
		hint?: string;
		keywords: string[];
		icon: IconName;
		path: RoutePath;
	};

	let query = $state('');

	const entries = $derived<Entry[]>([
		...navItems(withRecords, null).map((item) => ({
			id: `area:${item.route}`,
			group: m.command_areas(),
			label: item.label,
			keywords: [],
			icon: item.icon,
			path: item.path
		})),
		...tools.map((tool) => ({
			id: `tool:${tool.slug}`,
			group: m.nav_tools(),
			label: text(tool.name),
			hint: tool.legalBasis.map((basis) => cite(basis)).join(' · '),
			keywords: [text(tool.summary), ...tool.legalBasis.map((basis) => cite(basis))],
			icon: 'tool' as const,
			path: localized(`/werkzeuge/${tool.slug}`)
		})),
		{
			id: 'action:note',
			group: m.command_actions(),
			label: m.notes_new(),
			keywords: ['Notiz', 'note'],
			icon: 'plus',
			path: localized('/notizen?neu=1')
		}
	]);

	const groups = $derived(
		[...new Set(entries.map((entry) => entry.group))].map((group) => ({
			group,
			items: entries.filter((entry) => entry.group === group)
		}))
	);

	/** keeps the element in step with `open`; re-runs whenever `open` changes */
	function sync(dialog: HTMLDialogElement) {
		if (open && !dialog.open) {
			dialog.showModal();
			// showModal focuses the Command root; the search field should have it
			dialog.querySelector('input')?.focus();
		}
		if (!open && dialog.open) dialog.close();
	}

	function closed() {
		open = false;
		query = '';
	}

	function go(path: RoutePath) {
		open = false;
		void goto(resolve(path));
	}

	/** the sheet fills the dialog, so a click on the dialog itself is a click on the backdrop */
	function backdrop(event: MouseEvent & { currentTarget: HTMLDialogElement }) {
		if (event.target === event.currentTarget) event.currentTarget.close();
	}

	const editable = (target: EventTarget | null) =>
		target instanceof HTMLElement &&
		(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

	function shortcut(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			open = !open;
		} else if (event.key === '/' && !open && !editable(event.target)) {
			event.preventDefault();
			open = true;
		}
	}
</script>

<svelte:document onkeydown={shortcut} />

<!-- the Esc key closes the dialog natively, so the backdrop click needs no key handler -->
<dialog
	{@attach sync}
	class="palette"
	aria-label={m.search_open()}
	onclose={closed}
	onclick={backdrop}
>
	{#if open}
		<Command.Root
			class="daily-command"
			loop
			filter={(value, search, keywords) => score(value, search, keywords)}
		>
			<div class="field">
				<Icon name="search" size={18} />
				<Command.Input
					class="daily-command-input"
					placeholder={m.search_placeholder()}
					bind:value={query}
					aria-label={m.search_placeholder()}
				/>
				<kbd>Esc</kbd>
			</div>
			<Command.List class="daily-command-list">
				<Command.Viewport>
					<Command.Empty class="daily-command-empty">{m.control_no_match()}</Command.Empty>
					{#each groups as { group, items } (group)}
						<Command.Group class="daily-command-group">
							<Command.GroupHeading class="daily-command-heading">{group}</Command.GroupHeading>
							<Command.GroupItems>
								{#each items as entry (entry.id)}
									<Command.Item
										value={entry.label}
										keywords={entry.keywords}
										class="daily-command-item"
										onSelect={() => go(entry.path)}
									>
										<span class="ico"><Icon name={entry.icon} size={16} /></span>
										<span class="label">{entry.label}</span>
										{#if entry.hint}<span class="hint">{entry.hint}</span>{/if}
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/each}
					{#if query.trim()}
						<Command.Group class="daily-command-group">
							<Command.GroupHeading class="daily-command-heading"
								>{m.nav_norms()}</Command.GroupHeading
							>
							<Command.GroupItems>
								<Command.Item
									value={m.command_search_norms({ query: query.trim() })}
									class="daily-command-item"
									onSelect={() => go(localized(`/normen?q=${encodeURIComponent(query.trim())}`))}
								>
									<span class="ico"><Icon name="scale" size={16} /></span>
									<span class="label">{m.command_search_norms({ query: query.trim() })}</span>
								</Command.Item>
							</Command.GroupItems>
						</Command.Group>
					{/if}
				</Command.Viewport>
			</Command.List>
		</Command.Root>
	{/if}
</dialog>

<style>
	.palette {
		width: min(36rem, calc(100vw - 2rem));
		max-height: min(30rem, calc(100dvh - 6rem));
		margin: 12vh auto auto;
		padding: 0;
		overflow: hidden;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-modal);

		&::backdrop {
			background: rgba(28, 27, 25, 0.3);
		}

		& .field {
			display: flex;
			align-items: center;
			gap: 0.6rem;
			padding: 0.75rem 1rem;
			color: var(--ink3);
			border-bottom: 1px solid var(--rule2);

			& kbd {
				padding: 0.05rem 0.4rem;
				font-family: var(--mono);
				font-size: 11px;
				border: 1px solid var(--rule);
				border-radius: var(--radius-badge);
			}
		}

		& .ico {
			display: inline-grid;
			place-items: center;
			color: var(--ink3);
		}

		& .label {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& .hint {
			font-family: var(--mono);
			font-size: 11px;
			color: var(--ink3);
			white-space: nowrap;

			@media (max-width: 40rem) {
				display: none;
			}
		}
	}
</style>
