<!--
	@component
	Privacy notice (Art. 13 GDPR) in English. `preview` switches the hosting,
	sign-in and storage sections between the static preview on GitHub Pages
	and the production site on Hetzner. The German version is authoritative.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import type { Operator } from './operator.js';

	let { operator, preview, version }: { operator: Operator; preview: boolean; version: string } =
		$props();

	const missing = '[missing]';
	const date = $derived(new Date(version).toLocaleDateString('en-GB', { dateStyle: 'long' }));
</script>

<p class="lead">
	Daily is a workplace for data protection officers, AI officers and auditors. We process as little
	personal data as we can: no tracking, no analytics or advertising services, no social media
	plugins, no fonts or scripts from other servers. The German version of this notice is
	authoritative.
</p>

<h2>1. Controller</h2>
<p>The controller within the meaning of Art. 4(7) GDPR is:</p>
<address>
	{operator.name || missing}<br />
	{operator.street || missing}<br />
	{operator.city || missing}<br />
	{operator.country === 'Deutschland' ? 'Germany' : operator.country}<br />
	Email:
	{#if operator.email}<a href="mailto:{operator.email}">{operator.email}</a>{:else}{missing}{/if}
	{#if operator.phone}<br />Phone: {operator.phone}{/if}
</address>

<h2>2. Data protection officer</h2>
{#if operator.dpo}
	<p>
		{operator.dpo.name}, email:
		<a href="mailto:{operator.dpo.email}">{operator.dpo.email}</a>
	</p>
{:else}
	<p>No data protection officer is designated. Please send questions to the address under 1.</p>
{/if}

<h2>3. Visiting the website</h2>
{#if preview}
	<p>
		This public preview is a static website on GitHub Pages, a service of GitHub, Inc., 88 Colin P.
		Kelly Jr. Street, San Francisco, CA 94107, USA. When you visit it, GitHub processes your IP
		address, date and time, the address requested, the referrer and the browser identification to
		deliver the pages and keep the service secure. We do not receive these data ourselves.
	</p>
	<p>
		The legal basis is Art. 6(1)(f) GDPR; our legitimate interest is providing the preview reliably
		and securely. The transfer to the USA relies on the European Commission's adequacy decision for
		the EU-US Data Privacy Framework (Art. 45 GDPR), under which GitHub is certified. See
		<a
			href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
			>GitHub's privacy statement</a
		>.
	</p>
{:else}
	<p>
		Daily runs on our own servers at Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen,
		Germany, in data centres in Germany. Hetzner processes the data on our behalf (Art. 28 GDPR); a
		data processing agreement is in place.
	</p>
	<p>
		For each request our web server logs: date and time, the shortened IP address (for IPv4 only the
		first two blocks, for IPv6 only the first 32 bits), the request method, the path without
		parameters, the status code and the response time. Browser identification, referrer and cookies
		are not logged. The logs serve troubleshooting and defence against attacks and are deleted
		automatically after 7 days. The legal basis is Art. 6(1)(f) GDPR; our legitimate interest is
		secure operation.
	</p>
	<p>
		All connections are encrypted with TLS. A Content Security Policy prevents content from being
		loaded from other servers.
	</p>
{/if}

<h2>4. Cookies and browser storage</h2>
<p>
	We only use cookies that are strictly necessary for the service you request (§ 25(2) no. 2 TDDDG).
	They need no consent, so there is no cookie banner. The processing that follows relies on Art.
	6(1)(b) GDPR, for language and colour scheme on Art. 6(1)(f) GDPR.
</p>
<div class="table">
	<table>
		<thead>
			<tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
		</thead>
		<tbody>
			{#if !preview}
				<tr>
					<td><code>daily_session</code></td>
					<td>keeps you signed in; holds only a random identifier</td>
					<td>30 days or until you sign out</td>
				</tr>
				<tr>
					<td><code>daily_login</code></td>
					<td>protects the sign-in (state and PKCE key) and remembers the page to return to</td>
					<td>10 minutes</td>
				</tr>
				<tr>
					<td><code>daily_org</code></td>
					<td>remembers the selected organisation or client</td>
					<td>1 year</td>
				</tr>
			{/if}
			<tr>
				<td><code>PARAGLIDE_LOCALE</code></td>
				<td>remembers the selected language</td>
				<td>400 days</td>
			</tr>
			<tr>
				<td><code>theme</code></td>
				<td>remembers a colour scheme you chose (light/dark)</td>
				<td>1 year</td>
			</tr>
			{#if preview}
				<tr>
					<td><code>daily.records.v1</code> (localStorage)</td>
					<td>keeps the register entries you create in the preview, only in your browser</td>
					<td>until you delete them</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
{#if preview}
	<p>
		What you enter in registers in the preview never leaves your device. Delete it with “Delete
		local data” or through your browser's site data.
	</p>
{/if}

{#if !preview}
	<h2>5. Account and sign-in</h2>
	<p>
		For sign-in we run our own identity service (Keycloak) at <code>auth.dai-ly.de</code> on the same
		servers. Accounts are created by invitation only. We process your email address, your name and your
		password (stored only as a hash) and, if you wish, a second factor. Daily itself stores your email
		address, display name, language, and when you registered and last signed in.
	</p>
	<p>
		While you are signed in we store the sign-in tokens for each session to identify you to the
		identity service. A session ends after 30 days, in the identity service after 14 days without
		use. Expired sessions are deleted every night.
	</p>
	<p>
		To confirm your email address and reset your password, the identity service sends emails{#if operator.mailProvider}
			through {operator.mailProvider.name}, {operator.mailProvider.seat}, as processor{/if}.
	</p>
	<p>
		The legal basis is Art. 6(1)(b) GDPR (terms of use). We cannot set up an account without an
		email address and password; you are not obliged to provide anything else.
	</p>

	<h2>6. Your content</h2>
	<p>
		What you create in Daily – registers, assessments, audits, deadlines, notes and bookmarks – is
		stored in our database so you can work with it (Art. 6(1)(b) GDPR). Content belongs to an
		organisation; only its members can see it. The history of an entry records who changed it and
		when.
	</p>
	<p>
		If you enter personal data of third parties, such as employees or customers of your clients, we
		process them on your behalf. You or your client remain the controller; we conclude a data
		processing agreement with you under Art. 28 GDPR.
	</p>
{/if}

<h2>{preview ? 5 : 7}. Tools that work only in the browser</h2>
<p>
	The Anonymiser, the repository check and the guardrail test run entirely in your browser. Texts,
	files and results are not sent to us. The guardrail test sends requests only to the endpoint you
	enter yourself, directly from your browser; that connection is subject to the provider's terms.
</p>

<h2>{preview ? 6 : 8}. News and legal texts</h2>
<p>
	Our server fetches news and legal texts from public sources (EDPB, CJEU, supervisory authorities,
	the legal press, the EU Publications Office, gesetze-im-internet.de). Your browser does not
	connect to these sources. Only when you follow a link do you leave Daily; the privacy notice of
	that site then applies.
</p>

<h2>{preview ? 7 : 9}. Recipients and third countries</h2>
{#if preview}
	<p>The recipient is GitHub as host (see 3). We do not pass on data beyond that.</p>
{:else}
	<p>
		The only recipients are our processors: Hetzner as host{#if operator.mailProvider}
			and {operator.mailProvider.name} for sending emails{/if}. We do not transfer data to third
		countries, sell data or pass it on for advertising. We disclose data to authorities only where
		the law requires it.
	</p>
{/if}
<p>There is no automated decision-making or profiling within the meaning of Art. 22 GDPR.</p>

{#if !preview}
	<h2>10. Retention</h2>
	<ul>
		<li>Server logs: 7 days.</li>
		<li>Sessions: until they expire, at most 30 days; deleted the following night.</li>
		<li>
			Account and content: until you delete the account. Organisations that belong only to you are
			deleted with all their content.
		</li>
		<li>Backups: deleted data disappears from backups after 30 days at the latest.</li>
	</ul>
{/if}

<h2>{preview ? 8 : 11}. Your rights</h2>
<p>You have the right to</p>
<ul>
	<li>access to your data (Art. 15 GDPR),</li>
	<li>rectification (Art. 16 GDPR),</li>
	<li>erasure (Art. 17 GDPR),</li>
	<li>restriction of processing (Art. 18 GDPR),</li>
	<li>data portability (Art. 20 GDPR).</li>
</ul>
{#if !preview}
	<p>
		You handle access, a copy of your data and erasure yourself under
		<a href={resolve(localized('/konto'))}>Account</a>: it shows what we store about you, downloads
		a copy as JSON and deletes your account.
	</p>
{/if}
<p class="notice">
	<strong>Right to object (Art. 21 GDPR):</strong> Where we process data on the basis of Art. 6(1)(f)
	GDPR, you may object at any time on grounds relating to your particular situation. We will then stop
	processing the data unless we demonstrate compelling legitimate grounds that override your interests,
	or the processing serves the establishment, exercise or defence of legal claims.
</p>
<p>
	You may lodge a complaint with a data protection supervisory authority (Art. 77 GDPR), in
	particular in the Member State of your habitual residence, place of work or the alleged
	infringement.
	{#if operator.authority}
		The authority responsible for us is
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external site of the authority -->
		<a href={operator.authority.url} rel="external noopener noreferrer">{operator.authority.name}</a
		>.
	{/if}
</p>

<p class="version">Last updated: {date}</p>
