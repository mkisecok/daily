<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate, formatTime } from '#lib/i18n/date.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const works = $derived([
		m.preview_works_feed(),
		m.preview_works_tools(),
		m.preview_works_records(),
		m.preview_works_lang()
	]);
</script>

<svelte:head>
	<title>{m.preview_title()} — Daily</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<PageHeader title={m.preview_title()} description={m.preview_intro()}>
	{#snippet meta()}
		<p class="built">
			<span class="badge navy">
				<Icon name="clock" size={14} />
				{m.preview_built({
					date: formatLongDate(data.today, data.locale),
					time: formatTime(data.today, data.locale)
				})}
			</span>
		</p>
	{/snippet}
</PageHeader>

<div class="parts">
	<section class="card part">
		<h2>{m.preview_works_title()}</h2>
		<ul>
			{#each works as line (line)}
				<li><span class="mark"><Icon name="check" size={16} /></span><span>{line}</span></li>
			{/each}
		</ul>
	</section>

	<section class="card part missing">
		<h2>{m.preview_missing_title()}</h2>
		<p>{m.preview_missing_body()}</p>
	</section>
</div>

<style>
	.built {
		margin-top: 1rem;

		& .badge {
			white-space: normal;
		}
	}

	.parts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		align-items: start;
		gap: 1rem;

		& .part {
			padding: 1.35rem 1.5rem 1.5rem;

			& h2 {
				font-size: 21px;
			}

			& ul {
				display: flex;
				flex-direction: column;
				gap: 0.75rem;
				margin-top: 1rem;
				list-style: none;

				& li {
					display: flex;
					gap: 0.65rem;
					max-width: var(--measure);
					font-size: 14.5px;
					color: var(--ink2);
				}

				& .mark {
					display: inline-flex;
					flex: none;
					align-items: center;
					justify-content: center;
					width: 1.5rem;
					height: 1.5rem;
					margin-top: 0.05rem;
					color: var(--khaki);
					background: var(--khaki-soft);
					border-radius: var(--radius-badge);
				}
			}

			& p {
				max-width: var(--measure);
				margin-top: 1rem;
				font-size: 14.5px;
				color: var(--ink2);
			}

			&.missing {
				box-shadow:
					inset 4px 0 0 var(--navy),
					var(--shadow-raised);
			}
		}
	}
</style>
