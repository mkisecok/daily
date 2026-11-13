# Legal review

Every tool in Daily needs a review by a practising data protection officer or lawyer before it can
be marked `stable`. The reviewer reads the tool's questions or checklist, its outcomes, its notes
and its citations, and records the result here. The owner is not a data protection officer, so this
cannot be done from the code.

How to record a review:

1. Fill in the reviewer, the date and the findings in the tool's row.
2. Give each finding a severity:
   - **wrong result**: an outcome or deadline is legally wrong;
   - **incomplete**: a duty or exception is missing;
   - **wording**: unclear or imprecise, but not wrong.
3. Fix the findings, then set `reviewedAt` in the tool's manifest (`src/lib/tools/<slug>/tool.ts`)
   to the review date. Only then may its status become `stable`.

`src/lib/tools/review.spec.ts` checks that every tool has a row here, that a reviewed tool's date
matches its manifest, and that no tool is `stable` without a review.

Phase 0 is done when no row has an open finding of severity "wrong result".

| Tool                                        | Slug                             | Area        | Reviewer | Date | Findings | Severity | Status |
| ------------------------------------------- | -------------------------------- | ----------- | -------- | ---- | -------- | -------- | ------ |
| Verzeichnis von Verarbeitungstätigkeiten    | `vvt`                            | Datenschutz |          |      |          |          | open   |
| Datenschutz-Folgenabschätzung               | `dsfa`                           | Datenschutz |          |      |          |          | open   |
| DSFA-Schwellwertanalyse                     | `dsfa-schwellwert`               | Datenschutz |          |      |          |          | open   |
| Risikoklassifizierung                       | `risikoklassifizierung`          | KI          |          |      |          |          | open   |
| Transparenzpflichten                        | `transparenzpflichten`           | KI          |          |      |          |          | open   |
| Betreiberpflichten                          | `betreiberpflichten`             | KI          |          |      |          |          | open   |
| Interessenabwägung                          | `interessenabwaegung`            | Datenschutz |          |      |          |          | open   |
| Cookie- und Einwilligungs-Check             | `einwilligung-check`             | Datenschutz |          |      |          |          | open   |
| Drittland-Transfer                          | `drittland-transfer`             | Datenschutz |          |      |          |          | open   |
| Datenpanne                                  | `datenpanne`                     | Datenschutz |          |      |          |          | open   |
| Betroffenenanfrage                          | `betroffenenanfrage`             | Datenschutz |          |      |          |          | open   |
| Pseudonymisierer                            | `pseudonymisierer`               | Datenschutz |          |      |          |          | open   |
| AVV-Prüfung                                 | `avv-pruefung`                   | Datenschutz |          |      |          |          | open   |
| TOM-Katalog                                 | `tom-katalog`                    | Datenschutz |          |      |          |          | open   |
| SDM-Würfel                                  | `sdm-wuerfel`                    | Datenschutz |          |      |          |          | open   |
| Standortwechsel                             | `standortwechsel`                | Datenschutz |          |      |          |          | open   |
| Neue Software einführen                     | `software-einfuehrung`           | Datenschutz |          |      |          |          | open   |
| Eintritt und Austritt von Beschäftigten     | `personalwechsel`                | Datenschutz |          |      |          |          | open   |
| Videoüberwachung einrichten                 | `videoueberwachung`              | Datenschutz |          |      |          |          | open   |
| Website oder Shop starten                   | `website-start`                  | Datenschutz |          |      |          |          | open   |
| Anfrage der Aufsichtsbehörde                | `aufsichtsanfrage`               | Datenschutz |          |      |          |          | open   |
| Homeoffice und mobiles Arbeiten             | `mobiles-arbeiten`               | Datenschutz |          |      |          |          | open   |
| Dienstleister wechseln oder Vertrag beenden | `dienstleisterwechsel`           | Datenschutz |          |      |          |          | open   |
| Bewerbungsverfahren                         | `bewerbungsverfahren`            | Datenschutz |          |      |          |          | open   |
| Newsletter oder Werbekampagne               | `werbekampagne`                  | Datenschutz |          |      |          |          | open   |
| Unternehmenskauf und Betriebsübergang       | `unternehmenskauf`               | Datenschutz |          |      |          |          | open   |
| Standort schließen oder Geschäft aufgeben   | `schliessung`                    | Datenschutz |          |      |          |          | open   |
| Veranstaltung mit Fotos und Gästeliste      | `veranstaltung`                  | Datenschutz |          |      |          |          | open   |
| Hinweisgebersystem einrichten               | `hinweisgebersystem`             | Datenschutz |          |      |          |          | open   |
| Eigenes Modell trainieren                   | `modelltraining`                 | KI          |          |      |          |          | open   |
| Audit als geprüfte Stelle vorbereiten       | `auditvorbereitung`              | Audit       |          |      |          |          | open   |
| Löschkonzept                                | `loeschkonzept`                  | Datenschutz |          |      |          |          | open   |
| Schulungsnachweis                           | `schulungsnachweis`              | Datenschutz |          |      |          |          | open   |
| KI und DSGVO                                | `ki-dsgvo-schnittstelle`         | KI          |          |      |          |          | open   |
| Technische Dokumentation                    | `technische-dokumentation`       | KI          |          |      |          |          | open   |
| KI-Nutzungsrichtlinie                       | `ki-nutzungsrichtlinie`          | KI          |          |      |          |          | open   |
| AIMS-Gap-Analyse                            | `aims-gap`                       | KI          |          |      |          |          | open   |
| KI-Register                                 | `ki-register`                    | KI          |          |      |          |          | open   |
| KI-Kompetenz                                | `ki-kompetenz`                   | KI          |          |      |          |          | open   |
| KI-Tool einführen                           | `ki-einfuehrung`                 | KI          |          |      |          |          | open   |
| KI im Personalbereich                       | `ki-personal`                    | KI          |          |      |          |          | open   |
| Chatbot auf der Website                     | `chatbot`                        | KI          |          |      |          |          | open   |
| Vorfallmeldung                              | `vorfallmeldung`                 | KI          |          |      |          |          | open   |
| Grundrechte-Folgenabschätzung               | `grundrechte-folgenabschaetzung` | KI          |          |      |          |          | open   |
| Auditprogramm                               | `auditprogramm`                  | Audit       |          |      |          |          | open   |
| Prüfkatalog                                 | `pruefkatalog`                   | Audit       |          |      |          |          | open   |
| Feststellungen                              | `feststellungen`                 | Audit       |          |      |          |          | open   |
| Auditbericht                                | `auditbericht`                   | Audit       |          |      |          |          | open   |
| Repo-Check                                  | `repo-check`                     | Entwickler  |          |      |          |          | open   |
| Guardrail-Test                              | `guardrail-test`                 | Entwickler  |          |      |          |          | open   |
