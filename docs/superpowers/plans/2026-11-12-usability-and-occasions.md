# Usability of the tools, and tools for occasions

Written 2026-11-12 against `main` at `2ebddfd` (32 tools). It records measurements of how the
tools are to use today, lists the occasions in a DPO's or AI officer's work that could become
tools like Standortwechsel, and plans both. It is meant to work without the conversation it came
from. It adds to `2026-11-10-product-roadmap.md`; that plan's phase 0 (legal review, law as of)
still comes first.

## 1. How the tools are to use today (measured)

Measured on the static preview build at 1280 × 900 and 375 × 812, and from the tool definitions.

### 1.1 Forms are very long, with one save button at the end

| Form (new entry)   | Controls | Desktop: screens | Phone: screens |
| ------------------ | -------- | ---------------- | -------------- |
| DSFA               | 40       | 16.8             | 28.1           |
| Standortwechsel    | 81       | 11.2             | 19.7           |
| VVT                | 15       | 4.8              | 8.0            |
| TOM-Katalog        | 13       | 4.8              | 7.0            |
| Datenpanne         | 17       | 4.2              | 6.6            |
| Betroffenenanfrage | 10       | 3.0              | 4.6            |

Every form is one page. The only save button sits at the bottom (DSFA: 15,040 px down). Nothing is
sticky, there is no index of sections and no sign of how far one is.

### 1.2 Work in progress is lost on reload

- A half-filled entry form is empty after a reload. Leaving through a link asks first; a reload,
  a crash or a closed laptop does not help.
- A half-answered questionnaire has no answers after a reload, and leaving it does not ask.

### 1.3 Questionnaires ask everything, always

| Questionnaire         | Questions | Phone: screens |
| --------------------- | --------- | -------------- |
| Risikoklassifizierung | 29        | 16.3           |
| AIMS-Gap              | 19        | 10.2           |
| DSFA-Schwellwert      | 13        | 8.2            |

No questionnaire skips questions. Risikoklassifizierung asks all 29 even when the first answer
says "not an AI system". None shows progress ("12 of 29 answered").

### 1.4 Help is uneven

Questions or fields with a help text: DSFA-Schwellwert 12 of 13, DSFA 34 of 77, but
Einwilligungs-Check 0 of 13, Technische Dokumentation 0 of 13, AIMS-Gap 0 of 19, and none in
Auditbericht, Prüfkatalog and Auditprogramm.

### 1.5 Missing helpers

- No "duplicate entry" and no templates: the second VVT entry starts from nothing.
- No first-steps guidance anywhere; a visitor sees 32 tools sorted by legal area.
- Only some results hand over to a next tool (the attached assessments); most end at the result.
- Checklists are built from yes/no fields: no "not applicable" with a reason, no note or evidence
  per point.

### 1.6 Not measured

Whether real users reach a result, how long it takes, where they stop. The app has no analytics,
on purpose. Section 5 says how to find out without tracking.

## 2. Fixes for usability

| No. | Change                                                                                                                                                   | Fixes    | Size |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| U1  | Drafts: entry forms and questionnaires save to browser storage as one types; "Entwurf fortsetzen / verwerfen" on return                                  | 1.2      | S    |
| U2  | Long forms: a section index beside the form with a tick per finished section, and a sticky bar with Save and "3 of 9 sections"                           | 1.1      | M    |
| U3  | Questionnaire progress ("12 von 29") and a jump to the first unanswered question                                                                         | 1.3      | S    |
| U4  | Conditional questions: a question or section can depend on an earlier answer; start with Risikoklassifizierung and Transparenzpflichten                  | 1.3      | M    |
| U5  | Checklist kit: one compact row per point with Ja / Nein / Entfällt, a note and a due date; replaces the yes/no fields in Standortwechsel and AVV-Prüfung | 1.5, 1.1 | M    |
| U6  | Duplicate an entry; "Beispiel laden" per tool                                                                                                            | 1.5      | S    |
| U7  | "Nächster Schritt" under every result: the tool that follows, opened with what is already known                                                          | 1.5      | M    |
| U8  | Help texts for the tools at 0, written with the legal review of each tool                                                                                | 1.4      | M    |
| U9  | Catalogue entry by situation: "Ich habe einen Anlass" beside the areas, and a short first-steps path for new visitors                                    | 1.5      | S    |

U1 to U3 are independent and small; they come first. U5 is the base for section 3.

Each change follows the measurement workflow used so far: numbers before and after, desktop and
phone, light and dark, and an E2E test.

## 3. Tools for occasions

Standortwechsel showed a shape the catalogue did not have: not one legal duty, but one occasion
that touches many duties. Its parts are reusable:

- **Scope:** what the occasion includes; points and risks that do not apply drop out.
- **Checklist** in the order of the work, each point with its legal basis.
- **Risks** on the DSK matrix where the occasion has real ones.
- **Guards and deadlines:** what must be done before the next stage.
- **Links** to the entries the occasion creates or changes (VVT, TOM, AVV, DSFA, KI-Register).

With the checklist kit (U5) an occasion becomes mostly content: a definition file and its tests.

### 3.1 Candidates

Priority: A = frequent and many duties at once, B = regular, C = rare or narrow.

| Occasion                                              | Duties it bundles                                                                                                            | Uses existing tools                                                               | Prio |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---- |
| **Neue Software oder Cloud-Dienst einführen**         | Art. 28 contract, third-country transfer, DSFA threshold, TOM, VVT entry, deletion, works council (§ 87 Abs. 1 Nr. 6 BetrVG) | AVV-Prüfung, Drittland-Transfer, DSFA-Schwellwert, VVT, TOM                       | A    |
| **KI-Tool einführen** (Copilot, ChatGPT, …)           | KI-Register, risk class, Art. 50, GDPR interface, usage policy, AI literacy, vendor terms, works council                     | KI-Register, Risikoklassifizierung, KI-DSGVO, KI-Nutzungsrichtlinie, KI-Kompetenz | A    |
| **Eintritt und Austritt von Beschäftigten**           | Confidentiality undertaking, training, accounts and rights, devices, mailbox, deletion periods                               | Schulungsnachweis, Löschkonzept                                                   | A    |
| **Videoüberwachung einrichten**                       | § 4 BDSG, Art. 6 Abs. 1 lit. f, signs (Art. 13), storage period, DSFA threshold, works council                               | Interessenabwägung, DSFA-Schwellwert                                              | A    |
| **Website oder Shop starten oder umbauen**            | § 25 TDDDG, privacy notice, forms, tracking, newsletter opt-in, processors                                                   | Einwilligungs-Check, AVV-Prüfung                                                  | A    |
| **Anfrage oder Prüfung der Aufsichtsbehörde**         | Deadlines, Art. 31 cooperation, collecting the records, answer                                                               | VVT, TOM, DSFA, reports                                                           | B    |
| **Homeoffice, mobiles Arbeiten, eigene Geräte**       | TOM for remote work, rules, device encryption, family members, paper                                                         | TOM-Katalog                                                                       | B    |
| **Dienstleister wechseln oder Vertrag beenden**       | Return and deletion (Art. 28 Abs. 3 lit. g), migration, proof, new contract                                                  | AVV-Prüfung, Löschkonzept                                                         | B    |
| **Bewerbungsverfahren**                               | Notice, access rights, deletion after rejection, talent pool consent, AI in selection                                        | Löschkonzept, Risikoklassifizierung                                               | B    |
| **Newsletter oder Werbekampagne**                     | § 7 UWG, consent or existing customers, objection (Art. 21), proof                                                           | Einwilligungs-Check, Interessenabwägung                                           | B    |
| **KI im Personalbereich**                             | Annex III Nr. 4 high risk, Art. 26 Abs. 7 information of workers, Art. 22 GDPR, FRIA                                         | Risikoklassifizierung, Betreiberpflichten, FRIA                                   | B    |
| **Chatbot auf der Website**                           | Art. 50 notice, GDPR basis, logs, escalation to a person                                                                     | Transparenzpflichten, KI-DSGVO                                                    | B    |
| **Unternehmenskauf, Due Diligence, Betriebsübergang** | Data room, asset or share deal, information of data subjects, taking over records                                            | VVT, AVV-Prüfung                                                                  | C    |
| **Standort schließen, Geschäftsaufgabe**              | Retention against deletion, archives, handing over records, the DPO's end of office                                          | Löschkonzept, Standortwechsel                                                     | C    |
| **Veranstaltung mit Fotos und Gästeliste**            | Consent or legitimate interest, notices, publication                                                                         | Einwilligungs-Check                                                               | C    |
| **Hinweisgebersystem einrichten**                     | HinSchG, confidentiality, DSFA threshold, deletion after three years                                                         | DSFA-Schwellwert, Löschkonzept                                                    | C    |
| **Eigenes Modell trainieren oder anpassen**           | Legal basis for training data, EDPB Opinion 28/2024, provider status under the AI Act                                        | KI-DSGVO, Interessenabwägung                                                      | C    |
| **Audit als geprüfte Stelle vorbereiten**             | Evidence list, open findings, responsible people, dates                                                                      | Auditprogramm, Feststellungen                                                     | C    |

The legal bases named here are the starting points for each tool's content, not checked wording.
Each occasion gets its own source check and legal review before it leaves beta.

### 3.2 What an occasion tool must have

1. A scope question that removes what does not apply.
2. At most about 30 points, each one action with one legal basis.
3. A handover to the existing tool wherever a point is "do the check" (never a second copy of a
   questionnaire).
4. A result that names gaps first, then what is open.
5. Deadlines only where a date really exists.
6. A printout as a Vorgangsblatt (see the print plan).

## 4. Order of work

| Step | Content                                                        | Done when                                               |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | U1 drafts, U3 progress                                         | A reload keeps a half-filled form and questionnaire     |
| 2    | U2 section index and sticky save                               | Save is reachable from anywhere in the DSFA form        |
| 3    | U5 checklist kit; move Standortwechsel and AVV-Prüfung onto it | Standortwechsel's form is under half its length         |
| 4    | First occasions: Neue Software, KI-Tool einführen              | Each links to the existing checks and prints            |
| 5    | U4 conditional questions, U7 next step                         | Risikoklassifizierung ends early for "not an AI system" |
| 6    | Occasions: Eintritt/Austritt, Videoüberwachung, Website        | —                                                       |
| 7    | U6 duplicate and examples, U8 help texts, U9 entry by occasion | —                                                       |
| 8    | B and C occasions, in the order users ask for them             | —                                                       |

## 5. Finding out whether it works, without tracking

- **Five sessions with practitioners** (DPO, AI officer, auditor): each gets three tasks, such as
  "document this breach" or "decide whether this AI tool may be used". Note where they stop, what
  they ask, how long it takes. Repeat after steps 3 and 6.
- **A feedback link on every tool and result** ("Was hat gefehlt?") that opens a mail or a form
  without analytics.
- **Numbers the app already has** on the server, per organisation and without content: entries
  per tool, share of entries that reach their last state, results per questionnaire. They belong
  in the admin overview planned in October.

## 6. Sources (retrieved 2026-11-12)

The occasions list comes from the duties in GDPR, BDSG, TDDDG and the AI Act and from common
practice; the searches below gave context, not a ranking.

- Supervisory activity reports 2025 (complaint and breach numbers):
  <https://www.bundestag.de/presse/hib/kurzmeldungen-1178392>,
  <https://www.lda.bayern.de/media/baylda_report_15.pdf>,
  <https://www.lda.brandenburg.de/sixcms/media.php/9/TB_DS_2025.pdf>
- Leaving employees as a DPO check: <https://www.weka.de/datenschutz/verfahrenspruefung-ausscheidende-mitarbeiter/>
- First steps of a company DPO: <https://www.dr-datenschutz.de/betrieblicher-datenschutzbeauftragter-was-sind-die-ersten-schritte/>
- AI officer and the works council:
  <https://www.betriebsrat.de/br-magazin/kuenstliche-intelligenz/der-ki-beauftragte-staerkt-die-handlungsfaehigkeit-des-betriebsrats-4518733>
- Tasks of an AI officer: <https://www.mitsm.de/wissen/was-sind-die-aufgaben-eines-ki-beauftragten-im-unternehmen/>
