<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate, formatTime } from '#lib/i18n/date.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{m.preview_title()} — Daily</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<header class="head">
	<h1>{m.preview_title()}</h1>
	<p class="measure lead">{m.preview_intro()}</p>
	<p class="eyebrow">
		{m.preview_built({
			date: formatLongDate(data.today, data.locale),
			time: formatTime(data.today, data.locale)
		})}
	</p>
</header>

<section class="part">
	<h2>{m.preview_works_title()}</h2>
	<ul class="measure">
		<li>{m.preview_works_feed()}</li>
		<li>{m.preview_works_tools()}</li>
		<li>{m.preview_works_records()}</li>
		<li>{m.preview_works_lang()}</li>
	</ul>
</section>

<section class="part">
	<h2>{m.preview_missing_title()}</h2>
	<p class="measure">{m.preview_missing_body()}</p>
</section>

<style>
	.head {
		padding-bottom: 1.75rem;
		border-bottom: 1px solid var(--rule);

		& h1 {
			font-size: clamp(30px, 4vw, 40px);
		}

		& .lead {
			margin-top: 1rem;
			font-size: 17px;
			color: var(--ink2);
		}

		& .eyebrow {
			margin-top: 1.5rem;
		}
	}

	.part {
		padding: 2rem 0;
		border-bottom: 1px solid var(--rule2);

		& h2 {
			font-size: 22px;
		}

		& ul {
			margin: 0.75rem 0 0 1.25rem;

			& li {
				padding: 0.3rem 0;
				color: var(--ink2);
			}
		}

		& p {
			margin-top: 0.75rem;
			color: var(--ink2);
		}
	}
</style>
