<!--
	@component
	Datenschutzerklärung (Art. 13 DSGVO) in German. `preview` switches the
	hosting, sign-in and storage sections between the static preview on GitHub
	Pages and the production site on Hetzner.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import type { Operator } from './operator.js';

	let { operator, preview, version }: { operator: Operator; preview: boolean; version: string } =
		$props();

	const missing = '[fehlt]';
	const date = $derived(new Date(version).toLocaleDateString('de-DE', { dateStyle: 'long' }));
</script>

<p class="lead">
	Daily ist ein Arbeitsplatz für Datenschutzbeauftragte, KI-Beauftragte und Auditoren. Wir
	verarbeiten so wenige personenbezogene Daten wie möglich: kein Tracking, keine Analyse- oder
	Werbedienste, keine Social-Media-Plugins, keine Schriften oder Skripte von fremden Servern.
</p>

<h2>1. Verantwortlicher</h2>
<p>Verantwortlich im Sinne von Art. 4 Nr. 7 DSGVO ist:</p>
<address>
	{operator.name || missing}<br />
	{operator.street || missing}<br />
	{operator.city || missing}<br />
	{operator.country}<br />
	E-Mail:
	{#if operator.email}<a href="mailto:{operator.email}">{operator.email}</a>{:else}{missing}{/if}
	{#if operator.phone}<br />Telefon: {operator.phone}{/if}
</address>

<h2>2. Datenschutzbeauftragter</h2>
{#if operator.dpo}
	<p>
		{operator.dpo.name}, E-Mail:
		<a href="mailto:{operator.dpo.email}">{operator.dpo.email}</a>
	</p>
{:else}
	<p>
		Ein Datenschutzbeauftragter ist nicht benannt. Wenden Sie sich mit Fragen an die Adresse unter
		Nummer 1.
	</p>
{/if}

<h2>3. Aufruf der Website</h2>
{#if preview}
	<p>
		Diese öffentliche Vorschau ist eine statische Website auf GitHub Pages, einem Dienst der GitHub,
		Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Beim Aufruf verarbeitet GitHub
		Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Adresse, den Referrer und die
		Browserkennung, um die Seiten auszuliefern und die Sicherheit des Dienstes zu gewährleisten. Wir
		selbst erhalten diese Daten nicht.
	</p>
	<p>
		Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse ist die
		zuverlässige und sichere Bereitstellung der Vorschau. Die Übermittlung in die USA stützt sich
		auf den Angemessenheitsbeschluss der Europäischen Kommission zum EU-US Data Privacy Framework
		(Art. 45 DSGVO), unter dem GitHub zertifiziert ist. Näheres in der
		<a
			href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement"
			>Datenschutzerklärung von GitHub</a
		>.
	</p>
{:else}
	<p>
		Daily läuft auf eigenen Servern bei der Hetzner Online GmbH, Industriestr. 25, 91710
		Gunzenhausen, in Rechenzentren in Deutschland. Hetzner verarbeitet die Daten in unserem Auftrag
		(Art. 28 DSGVO); ein Vertrag zur Auftragsverarbeitung besteht.
	</p>
	<p>
		Beim Aufruf protokolliert unser Webserver für jede Anfrage: Datum und Uhrzeit, die gekürzte
		IP-Adresse (bei IPv4 nur die ersten zwei Blöcke, bei IPv6 nur die ersten 32 Bit), die
		Anfragemethode, den aufgerufenen Pfad ohne Parameter, den Statuscode und die Antwortzeit.
		Browserkennung, Referrer und Cookies werden nicht protokolliert. Die Protokolle dienen der
		Fehlersuche und der Abwehr von Angriffen und werden nach 7 Tagen automatisch gelöscht.
		Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse ist der sichere
		Betrieb.
	</p>
	<p>
		Alle Verbindungen sind per TLS verschlüsselt. Eine Content Security Policy verhindert, dass
		Inhalte von fremden Servern geladen werden.
	</p>
{/if}

<h2>4. Cookies und Speicher im Browser</h2>
<p>
	Wir verwenden nur Cookies, die für den von Ihnen gewünschten Dienst unbedingt erforderlich sind (§
	25 Abs. 2 Nr. 2 TDDDG). Eine Einwilligung ist dafür nicht nötig; ein Cookie-Banner gibt es deshalb
	nicht. Die anschließende Verarbeitung stützt sich auf Art. 6 Abs. 1 lit. b DSGVO, für Sprache und
	Farbschema auf Art. 6 Abs. 1 lit. f DSGVO.
</p>
<div class="table">
	<table>
		<thead>
			<tr><th>Name</th><th>Zweck</th><th>Dauer</th></tr>
		</thead>
		<tbody>
			{#if !preview}
				<tr>
					<td><code>daily_session</code></td>
					<td>hält Sie nach der Anmeldung angemeldet; enthält nur eine zufällige Kennung</td>
					<td>30 Tage oder bis zur Abmeldung</td>
				</tr>
				<tr>
					<td><code>daily_login</code></td>
					<td>schützt den Anmeldevorgang (state und PKCE-Schlüssel) und merkt sich die Zielseite</td
					>
					<td>10 Minuten</td>
				</tr>
				<tr>
					<td><code>daily_org</code></td>
					<td>merkt sich die gewählte Organisation bzw. den Mandanten</td>
					<td>1 Jahr</td>
				</tr>
			{/if}
			<tr>
				<td><code>PARAGLIDE_LOCALE</code></td>
				<td>merkt sich die gewählte Sprache</td>
				<td>400 Tage</td>
			</tr>
			<tr>
				<td><code>theme</code></td>
				<td>merkt sich ein selbst gewähltes Farbschema (hell/dunkel)</td>
				<td>1 Jahr</td>
			</tr>
			{#if preview}
				<tr>
					<td><code>daily.records.v1</code> (localStorage)</td>
					<td>
						speichert Einträge, die Sie in der Vorschau in Registern anlegen, nur in Ihrem Browser
					</td>
					<td>bis Sie sie löschen</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
{#if preview}
	<p>
		Was Sie in der Vorschau in Register eintragen, verlässt Ihr Gerät nicht. Sie löschen es mit
		„Lokale Daten löschen“ oder über die Website-Daten Ihres Browsers.
	</p>
{/if}

{#if !preview}
	<h2>5. Konto und Anmeldung</h2>
	<p>
		Für die Anmeldung betreiben wir einen eigenen Identitätsdienst (Keycloak) unter
		<code>auth.dai-ly.de</code> auf denselben Servern. Ein Konto wird nur auf Einladung angelegt. Dabei
		verarbeiten wir Ihre E-Mail-Adresse, Ihren Namen und Ihr Passwort (nur als Hash gespeichert) sowie
		auf Wunsch einen zweiten Faktor. Daily selbst speichert Ihre E-Mail-Adresse, Ihren Anzeigenamen, die
		Sprache, den Zeitpunkt der Registrierung und der letzten Anmeldung.
	</p>
	<p>
		Solange Sie angemeldet sind, speichern wir je Sitzung die Anmelde-Tokens, um Sie gegenüber dem
		Identitätsdienst auszuweisen. Eine Sitzung endet nach 30 Tagen, im Identitätsdienst nach 14
		Tagen ohne Nutzung. Abgelaufene Sitzungen werden jede Nacht gelöscht.
	</p>
	<p>
		Für die Bestätigung Ihrer E-Mail-Adresse und das Zurücksetzen des Passworts versendet der
		Identitätsdienst E-Mails{#if operator.mailProvider}
			über {operator.mailProvider.name}, {operator.mailProvider.seat}, als Auftragsverarbeiter{/if}.
	</p>
	<p>
		Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Nutzungsvertrag). Ohne E-Mail-Adresse und
		Passwort können wir kein Konto einrichten; zu weiteren Angaben sind Sie nicht verpflichtet.
	</p>

	<h2>6. Ihre Inhalte</h2>
	<p>
		Was Sie in Daily anlegen – Register, Bewertungen, Prüfungen, Fristen, Notizen und Lesezeichen –
		speichern wir in unserer Datenbank, damit Sie damit arbeiten können (Art. 6 Abs. 1 lit. b
		DSGVO). Inhalte gehören zu einer Organisation; sehen können sie nur deren Mitglieder. Die
		Historie eines Eintrags hält fest, wer ihn wann geändert hat.
	</p>
	<p>
		Tragen Sie personenbezogene Daten Dritter ein, etwa von Beschäftigten oder Kunden Ihrer
		Mandanten, verarbeiten wir diese in Ihrem Auftrag. Verantwortlich bleiben Sie bzw. Ihr Mandant;
		dafür schließen wir mit Ihnen einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.
	</p>
{/if}

<h2>{preview ? 5 : 7}. Werkzeuge, die nur im Browser arbeiten</h2>
<p>
	Der Anonymisierer, der Repository-Check und der Guardrail-Test laufen vollständig in Ihrem
	Browser. Texte, Dateien und Ergebnisse werden nicht an uns übertragen. Der Guardrail-Test sendet
	Anfragen nur an den Endpunkt, den Sie selbst eintragen, und zwar direkt aus Ihrem Browser; für
	diese Verbindung gelten die Bedingungen des jeweiligen Anbieters.
</p>

<h2>{preview ? 6 : 8}. Nachrichten und Normtexte</h2>
<p>
	Nachrichten und Gesetzestexte ruft unser Server bei den öffentlichen Quellen ab (EDSA, EuGH,
	Aufsichtsbehörden, Fachpresse, Amt für Veröffentlichungen der EU, gesetze-im-internet.de). Ihr
	Browser stellt dabei keine Verbindung zu diesen Quellen her. Erst wenn Sie einem Link folgen,
	verlassen Sie Daily; dann gilt die Datenschutzerklärung der jeweiligen Seite.
</p>

<h2>{preview ? 7 : 9}. Empfänger und Drittländer</h2>
{#if preview}
	<p>
		Empfänger ist GitHub als Hoster (siehe Nummer 3). Darüber hinaus geben wir keine Daten weiter.
	</p>
{:else}
	<p>
		Empfänger sind nur unsere Auftragsverarbeiter: Hetzner als Hoster{#if operator.mailProvider}
			und {operator.mailProvider.name} für den E-Mail-Versand{/if}. Wir übermitteln keine Daten in
		Drittländer, verkaufen keine Daten und geben sie nicht zu Werbezwecken weiter. An Behörden geben
		wir Daten nur, wenn wir gesetzlich dazu verpflichtet sind.
	</p>
{/if}
<p>
	Es findet keine automatisierte Entscheidungsfindung und kein Profiling im Sinne von Art. 22 DSGVO
	statt.
</p>

{#if !preview}
	<h2>10. Speicherdauer</h2>
	<ul>
		<li>Server-Protokolle: 7 Tage.</li>
		<li>Sitzungen: bis zum Ablauf, spätestens 30 Tage; danach in der folgenden Nacht gelöscht.</li>
		<li>
			Konto und Inhalte: bis Sie das Konto löschen. Organisationen, die nur Ihnen gehören, werden
			mit allen Inhalten gelöscht.
		</li>
		<li>
			Datensicherungen: Gelöschtes verschwindet spätestens nach 30 Tagen auch aus den Sicherungen.
		</li>
	</ul>
{/if}

<h2>{preview ? 8 : 11}. Ihre Rechte</h2>
<p>Sie haben das Recht auf</p>
<ul>
	<li>Auskunft über Ihre Daten (Art. 15 DSGVO),</li>
	<li>Berichtigung (Art. 16 DSGVO),</li>
	<li>Löschung (Art. 17 DSGVO),</li>
	<li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
	<li>Datenübertragbarkeit (Art. 20 DSGVO).</li>
</ul>
{#if !preview}
	<p>
		Auskunft, Datenkopie und Löschung erledigen Sie selbst unter
		<a href={resolve(localized('/konto'))}>Konto</a>: Dort sehen Sie, was wir über Sie speichern,
		laden eine Kopie als JSON herunter und löschen Ihr Konto.
	</p>
{/if}
<p class="notice">
	<strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Soweit wir Daten auf Grund von Art. 6 Abs. 1 lit.
	f DSGVO verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit
	widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir weisen zwingende schutzwürdige
	Gründe nach, die Ihre Interessen überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung
	oder Verteidigung von Rechtsansprüchen.
</p>
<p>
	Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), insbesondere in
	dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes.
	{#if operator.authority}
		Für uns zuständig ist
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external site of the authority -->
		<a href={operator.authority.url} rel="external noopener noreferrer">{operator.authority.name}</a
		>.
	{/if}
</p>

<p class="version">Stand: {date}</p>
