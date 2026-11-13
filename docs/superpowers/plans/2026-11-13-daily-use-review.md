# Daily use review: which tools carry real work

Written 2026-11-13 against `main` at `c108fee`, at the owner's request: every tool must carry real
daily work for a data protection officer, AI officer, auditor or legal engineer, and the workspace
matters most. No tool may exist only to have one more tool. This review decides where work goes
next; removals and merges wait for the owner's decision.

## 1. How it was tested

- **Inventory** of all 50 tools: fields, required fields, example, deadlines, states, links to
  other tools, situation card, own print document.
- **Real tasks** per role, taken from Art. 38, 39 DSGVO, Art. 4, 26, 50, 73 KI-VO and ISO 19011:
  what comes back every week, what comes back every year, what happens once.
- **Walkthrough** in the preview of eight frequent tasks: open the tool, fill the required fields,
  save, look at the result and at the Fristen page.

| Task                          | Tool               | Fields shown | Required | Example | Result after saving             | Deadline on Fristen          |
| ----------------------------- | ------------------ | -----------: | -------: | ------- | ------------------------------- | ---------------------------- |
| Auskunftsersuchen beantworten | Betroffenenanfrage |           15 |        2 | no      | "Antwort fällig bis 13.12.2026" | yes, one month               |
| Datenpanne bearbeiten         | Datenpanne         |           22 |        3 | no      | "Risiko noch nicht bewertet"    | yes, 72 hours                |
| Neuen Dienstleister prüfen    | AVV-Prüfung        |           17 |        3 | no      | "Prüfung offen: 9 von 9"        | no (only with a review date) |
| KI-System ins Register        | KI-Register        |           15 |        4 | no      | "Risikoklasse ungeklärt"        | no (only with a review date) |
| Schulung nachweisen           | Schulungsnachweis  |           12 |        2 | no      | "Schulung ohne Nachweis"        | no (only with a repetition)  |
| Feststellung aus einem Audit  | Feststellungen     |           14 |        3 | no      | "Wesentliche Abweichung offen"  | no (only with a due date)    |
| KI-Tool einführen             | KI-Tool einführen  |           13 |        1 | yes     | "Umfang fehlt"                  | no (until a date is set)     |
| Neue Software einführen       | Neue Software      |           13 |        1 | yes     | "Umfang fehlt"                  | no (until a date is set)     |

## 2. Findings

1. **The workspace is not a workspace.** The start page says "Der tägliche Arbeitsplatz", but shows
   a claim, an intro and links to areas. Whoever opens Daily in the morning does not see what is due
   today, which Auskunft is open, which breach is running or which finding is overdue. Deadlines
   exist, but on a page of their own; open entries per tool only on that tool's page. It also says
   "Nr. 32" while there are 50 tools.
2. **Effort is inverted.** The tools used every week have no example (Betroffenenanfrage,
   Datenpanne, AVV-Prüfung, KI-Register, Schulungsnachweis, Feststellungen, Löschkonzept,
   TOM-Katalog, DSFA, Auditprogramm). The rare occasions all have one (Unternehmenskauf,
   Veranstaltung, Schließung).
3. **The core tasks work.** An Auskunft gets its one-month deadline, a breach its 72 hours; both
   reach the Fristen page and print. What is missing for daily use is the output people send: the
   answer to an Auskunft (Art. 15 lit. a to h and the copy) does not exist as a document.
4. **Overlaps.** Several things live in two or three places:
   - training: Schulungsnachweis and KI-Kompetenz;
   - introducing AI: KI-Tool einführen, KI im Personalbereich, Chatbot;
   - HR processes: Eintritt und Austritt (an entry per person, which no DPO keeps for every hire)
     and Bewerbungsverfahren;
   - sites: Standortwechsel (73 fields) and Schließung;
   - vendors: Dienstleister wechseln next to Neue Software and AVV-Prüfung;
   - AI and GDPR: the KI und DSGVO questionnaire repeats what KI-Tool einführen and Eigenes Modell
     trainieren already ask.
5. **One tool is method, not work.** The SDM-Würfel (48 fields) models a processing in the cube of
   the Standard-Datenschutzmodell. The TOM-Katalog already sorts measures by the same seven goals;
   nobody fills a cube as a daily task.

## 3. Verdict per tool

**Core, improve first (daily or weekly work, 20):** Betroffenenanfrage, Datenpanne, AVV-Prüfung,
VVT, DSFA, DSFA-Schwellwertanalyse, TOM-Katalog, Löschkonzept, Schulungsnachweis, Interessenabwägung,
Cookie- und Einwilligungs-Check, Drittlandtransfer, KI-Register, Risikoklassifizierung, KI-Tool
einführen, Neue Software einführen, Transparenzpflichten, KI-Nutzungsrichtlinie, Auditprogramm,
Feststellungen.

**Keep as they are (real, but monthly or rarer; no further investment for now, 19):**
Videoüberwachung, Website oder Shop starten, Anfrage der Aufsichtsbehörde, Veranstaltung,
Werbekampagne, Homeoffice, Hinweisgebersystem, Eigenes Modell trainieren, Audit als geprüfte Stelle,
Unternehmenskauf, Betreiberpflichten, Vorfallmeldung, Grundrechte-Folgenabschätzung,
AIMS-Gap-Analyse, Prüfkatalog, Auditbericht, Pseudonymisierer, Repo-Check, Guardrail-Test.
Technische Dokumentation stays for providers of high-risk systems, who are few among the users.

**Merge (owner's decision), from 11 tools to 5:**

| Today                                               | Proposal                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Schulungsnachweis + KI-Kompetenz                    | One training register; Art. 4 KI-VO as a kind of training with its per-role duties    |
| KI-Tool einführen + KI im Personalbereich + Chatbot | One "KI-Tool einführen" with the parts for HR use and customer chatbots as scope      |
| Eintritt und Austritt + Bewerbungsverfahren         | One "Personalprozesse" set up once, from application to exit, not an entry per person |
| Standortwechsel + Schließung                        | One "Standort: Umzug oder Schließung", with the 73 fields cut down                    |
| Dienstleister wechseln → Neue Software einführen    | "Ablösung eines Dienstleisters" as a scope of Neue Software                           |

**Remove from the catalogue (owner's decision, 2):** SDM-Würfel (method, covered by the
TOM-Katalog's seven goals); KI und DSGVO (its questions live in KI-Tool einführen and Eigenes Modell
trainieren; the attached checks keep working).

Result: from 50 tools to 42 (merges save 6, removals 2), each with a task behind it.

## 4. Order of work

1. **"Heute" as the start page of the workspace.** Due and overdue deadlines; open Auskünfte with
   days left; running breaches with hours left; open findings; entries waiting for a step; quick
   start for the six most frequent tasks. Everything from data Daily already has.
2. **Examples for the core tools** without one, so a visitor sees a real case in one click.
3. **Merges and removals** above, once decided.
4. **Print step 5, only documents people send:** the answer to an Auskunft (Art. 15), the DSFA in
   the structure of DSK Kurzpapier Nr. 5, the KI-Nutzungsrichtlinie as a policy to sign, the
   Auditbericht. The SDM cube document is dropped.
5. Later, from the roadmap: export and import of all entries (preview data lives in one browser),
   a vendor overview with review dates, a privacy notice generator.
