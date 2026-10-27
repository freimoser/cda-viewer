# CDA-Viewer

Viewer für **HL7 CDA**-Dokumente (Clinical Document Architecture R2), zum Beispiel Arztbriefe und C-CDA-Dokumente. Läuft komplett im Browser: kein Upload, keine Cookies, keine externen Ressourcen, kein XSLT.

**Live:** https://freimoser.github.io/cda-viewer/

## Funktionen
- Kopf (Patient, Autor, Verwahrer, Empfänger, Unterzeichner), Inhaltsverzeichnis, Abschnitte mit Narrativtext (Allowlist), codierte Einträge als Tabelle (Level 3)
- Ansichten „Dokument“, „Strukturdaten“, „Roh-XML“, Druckansicht
- Plausibilitätshinweise (keine Schematron- oder Konformitätsprüfung, keine Signaturprüfung, kein Medizinprodukt)
- Fünf Beispiele: drei aus [HL7/C-CDA-Examples](https://github.com/HL7/C-CDA-Examples) (CC0), zwei eigene fiktive deutsche Arztbriefe (MIT)

## Entwicklung
```
npm install            # nur jsdom für Tests und Build
npm test               # node --test tests/*.test.mjs
npm run build          # erzeugt alle Seiten im Repository-Root (GitHub Pages liefert main/ aus)
npm run serve          # http://localhost:8777/cda-viewer/
npm run check          # Links, JSON-LD, Sitemap gegen den laufenden Server
python3 tests/e2e.py   # Playwright-E2E (Python Playwright, Chrome)
python3 scripts/gen-assets.py  # Icons und og-image neu rendern
```
Der Quelltext liegt in `src/`, die erzeugten Dateien (`index.html`, `assets/`, Unterseiten) werden mitcommittet, weil GitHub Pages ohne Workflow direkt aus dem Root von `main` ausliefert.

## Sicherheit
Content-Security-Policy per Meta-Tag (`default-src 'none'`, `connect-src 'none'`, kein Inline-Skript). Dokumentinhalt wird nie per `innerHTML` eingefügt; Narrativtext läuft durch eine Allowlist (`src/js/render.mjs`). DOCTYPE/ENTITY werden abgelehnt, Dateien über 15 MB nicht geladen.

Bekannte Einschränkung: Bei kaputtem XML baut Chrome im DOMParser ein `parsererror` mit Inline-Style, das unter der strengen CSP (`style-src 'self'`) einen Konsolenhinweis auslöst. Der Viewer prüft deshalb vorab bestimmte Fehler selbst (`wellFormedError` in `src/js/cda.mjs`: nicht geschlossene oder falsch verschachtelte Elemente, nacktes `&`, ungültige Attribute, fehlendes Wurzelelement) und meldet Zeile und Spalte, ohne den Parser aufzurufen. Seltenere Fehler (etwa ungültige Zeichen) gehen weiter an den Browser-Parser und können diesen harmlosen Konsolenhinweis auslösen; die Anzeige ist davon nicht betroffen.

## Lizenz
MIT, siehe [LICENSE](LICENSE). Drittmaterial: [THIRD-PARTY-LICENSES](THIRD-PARTY-LICENSES). Belege: [quellen.md](quellen.md). HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen.

Entwickelt von [Thomas Freimoser](https://freimoser.de/) (München / Remote), [LinkedIn](https://www.linkedin.com/in/thomas-freimoser/).
