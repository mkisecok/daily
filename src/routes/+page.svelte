<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import Icon from '#lib/ui/Icon.svelte';
	import type { IconName } from '#lib/ui/icons.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** deadlines read records, so like the sidebar they show when signed in or in the preview */
	const withRecords = $derived(!!data.user || PUBLIC_PREVIEW);

	type Area = { route: string; icon: IconName; title: string; body: string };

	const areas = $derived(
		(
			[
				{
					route: '/werkzeuge',
					icon: 'tool',
					title: m.nav_tools(),
					body: m.home_area_tools()
				},
				{
					route: '/normen',
					icon: 'scale',
					title: m.nav_norms(),
					body: m.home_area_norms()
				},
				{
					route: '/notizen',
					icon: 'notes',
					title: m.nav_notes(),
					body: m.home_area_notes()
				},
				{
					route: '/fristen',
					icon: 'clock',
					title: m.deadlines_title(),
					body: m.home_area_deadlines()
				}
			] satisfies Area[]
		).filter((area) => withRecords || area.route !== '/fristen')
	);

	const sections = $derived([
		{
			numeral: 'I.',
			title: m.landing_read_title(),
			body: m.landing_read_body(),
			href: resolve(localized('/nachrichten')),
			link: m.nav_feed()
		},
		{
			numeral: 'II.',
			title: m.landing_note_title(),
			body: m.landing_note_body(),
			href: resolve(localized('/notizen')),
			link: m.nav_notes()
		},
		{
			numeral: 'III.',
			title: m.landing_work_title(),
			body: m.landing_work_body(),
			href: resolve(localized('/werkzeuge')),
			link: m.nav_tools()
		}
	]);
</script>

<svelte:head>
	<title>Daily — {m.site_tagline()}</title>
	<meta name="description" content={m.landing_claim()} />
</svelte:head>

<PageHeader eyebrow={m.site_tagline()} title={m.landing_claim()} description={m.landing_intro()}>
	{#snippet meta()}
		<p class="today">
			<time datetime={data.today.slice(0, 10)}>{formatLongDate(data.today, data.locale)}</time>
			<span class="badge">{m.dateline_issue({ n: String(data.issue) })}</span>
			<span class="status">{m.landing_status()}</span>
		</p>
	{/snippet}
</PageHeader>

<section class="areas" aria-labelledby="areas-title">
	<h2 id="areas-title" class="section-title">{m.command_areas()}</h2>
	<ul>
		{#each areas as area (area.route)}
			<li class="card area">
				<span class="ico"><Icon name={area.icon} size={20} /></span>
				<h3><a href={resolve(localized(area.route))}>{area.title}</a></h3>
				<p>{area.body}</p>
				<span class="arrow" aria-hidden="true">→</span>
			</li>
		{/each}
	</ul>
</section>

<div class="parts">
	{#each sections as section (section.numeral)}
		<section class="card part">
			<span class="numeral" aria-hidden="true">{section.numeral}</span>
			<h2>{section.title}</h2>
			<p>{section.body}</p>
			<a class="more" href={section.href}>{section.link} →</a>
		</section>
	{/each}
</div>

<style>
	.today {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		margin-top: 1rem;
		font-size: 14px;
		color: var(--ink2);

		& time {
			font-family: var(--serif);
			font-size: 15px;
		}

		& .badge {
			font-family: var(--mono);
		}

		& .status {
			color: var(--ink3);
		}
	}

	.section-title {
		margin-bottom: 0.9rem;
		font-family: var(--sans);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--ink3);
	}

	.areas {
		& ul {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
			gap: 1rem;
			list-style: none;
		}

		/* the whole card is the link; the title's link stretches over it */
		& .area {
			position: relative;
			display: flex;
			flex-direction: column;
			gap: 0.4rem;
			min-height: 9.5rem;
			padding: 1.1rem 1.25rem 1.25rem;
			transition:
				border-color 0.12s ease,
				box-shadow 0.12s ease;

			@media (prefers-reduced-motion: reduce) {
				transition: none;
			}

			& .ico {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 2.25rem;
				height: 2.25rem;
				margin-bottom: 0.35rem;
				color: var(--navy);
				background: var(--navy-soft);
				border-radius: var(--radius);
			}

			& h3 {
				font-size: 19px;

				& a {
					color: var(--ink);

					&::after {
						content: '';
						position: absolute;
						inset: 0;
						border-radius: inherit;
					}

					&:hover {
						text-decoration: none;
					}

					&:focus-visible {
						outline: none;
					}
				}
			}

			& p {
				font-size: 14px;
				line-height: 1.5;
				color: var(--ink2);
			}

			& .arrow {
				margin-top: auto;
				padding-top: 0.5rem;
				color: var(--navy);
				transition: transform 0.12s ease;

				@media (prefers-reduced-motion: reduce) {
					transition: none;
				}
			}

			&:hover {
				border-color: var(--rule);
				box-shadow: var(--shadow-float);

				& .arrow {
					transform: translateX(3px);
				}
			}

			&:has(a:focus-visible) {
				outline: 2px solid var(--navy);
				outline-offset: 2px;
			}
		}
	}

	.parts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: 1rem;
		margin-top: 2.5rem;

		& .part {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding: 1.35rem 1.5rem 1rem;

			& .numeral {
				font-family: var(--serif);
				font-size: 15px;
				font-weight: 600;
				color: var(--ink3);
			}

			& h2 {
				font-size: 22px;
			}

			& p {
				font-size: 14.5px;
				color: var(--ink2);
			}

			& .more {
				display: inline-flex;
				align-items: center;
				align-self: flex-start;
				min-height: 44px;
				margin-top: auto;
				font-size: 14px;
				font-weight: 500;
			}
		}
	}
</style>
