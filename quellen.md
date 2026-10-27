# Quellen

Stand der Prüfung: 27.10.2026. Alle fachlichen Aussagen auf den Seiten stützen sich auf die folgenden Dokumente. Was nicht hier steht, ist Verhalten des Viewers und steht im Code (`src/js/`).

## Standards und Leitfäden
| Quelle | Wofür |
|---|---|
| [VHitG-Arztbrief-Leitfaden v1.50](https://download.hl7.de/documents/cdar2-arztbrief/Leitfaden-VHitG-Arztbrief-v150.pdf) (Template-OID 1.2.276.0.76.3.1.13.7.5, 12.05.2006) | Definition und Kerneigenschaften von CDA (Kap. 3.2–3.4), Lesbarkeit des authentifizierten Inhalts (3.3.6), Level (6.2), Kopfelemente, Dokumenttyp- und Abschnittscodes |
| [HL7 Deutschland, Downloads](https://hl7.de/downloads/) und [Wiki, Arztbrief Plus](https://wiki.hl7.de/index.php?title=IG%3AArztbrief_Plus) | Einordnung: Leitfaden v1.50 als „Arztbrief 2006“, Nachfolger „Arztbrief 2014/2015“ |
| [HL7 C-CDA IG v5.0.0](https://hl7.org/cda/us/ccda/) | Dokumenttypen und Zweck von C-CDA, Verwendung zusammen mit CDA R2 |
| [FHIR Documents](https://www.hl7.org/fhir/documents.html) | Bundle vom Typ document mit Composition als erster Ressource; DocumentReference verweist auch auf PDFs und CDAs |

## eArztbrief
| Quelle | Wofür |
|---|---|
| [KBV-Richtlinie elektronischer Brief](https://www.kbv.de/documents/infothek/rechtsquellen/weitere-vertraege/praxen/telemedizin/rl-earztbrief.pdf) (in Kraft seit 17.05.2024, § 383 SGB V) | PDF/A plus XML nach VHitG v1.50, der body darf leer sein, qualifizierte elektronische Signatur |
| [KBV, eArztbrief](https://www.kbv.de/praxis/digitalisierung/anwendungen/earztbrief) | Versand über KIM, Empfangspflicht seit 30.06.2024 |

## Browser
| Quelle | Wofür |
|---|---|
| [Chrome for Developers, Removing XSLT](https://developer.chrome.com/docs/web-platform/deprecating-xslt) | Chrome 158 am 17.11.2026, Chrome 176 am 17.08.2027 (Zeitplan kann sich ändern) |
| [Chrome Status](https://chromestatuslite.com/feature/4709671889534976) | Gegenprüfung des Zeitplans |

## Beispieldaten
- `hl7-ccda-ccd.xml`, `hl7-ccda-discharge-summary.xml`, `hl7-ccda-consultation-note.xml`: [HL7/C-CDA-Examples](https://github.com/HL7/C-CDA-Examples), Commit `ad5007abd912a45bbd04ce96e871c70954c2b2c2`. LICENSE-Datei: CC0 1.0 Universal. Die README verweist zusätzlich auf die HL7 GOM (Abschnitt 09, Geistiges Eigentum). Jede Datei trägt den Hinweis, dass sie die Daten einer fiktiven Person enthält. Einzige Änderung: eine E-Mail-Adresse wurde durch `isabella.jones@example.org` ersetzt. Die Dateien behalten ihre eigenen Codes (LOINC und weitere).
- `de-arztbrief-entlassbrief.xml`, `de-arztbrief-facharzt-level3.xml`: eigene, frei erfundene Beispiele (MIT). Nur LOINC-Codes, nicht gegen einen Leitfaden oder Schematron geprüft. Keine Dateien von KBV oder HL7 Deutschland.
- LOINC: Copyright Regenstrief Institute, Inc., <https://loinc.org/>. Der Viewer enthält keine LOINC-Tabelle.

## Marken
„HL7“ und „FHIR“ sind eingetragene Marken von HL7 International (Grundlage: [FHIR License and Copyright](https://www.hl7.org/fhir/license.html)). „CDA“ wird hier nicht als Marke beansprucht. Keine Verbindung zu HL7 International oder HL7 Deutschland.

## Bewusst nicht behauptet
Vergleiche mit anderen Viewern (KBV MIO Viewer und andere), Aussagen zu ePA-Spezifikationen und zu Prüfwerkzeugen stehen nicht auf den Seiten, weil dafür keine geprüfte Quelle vorliegt.
