/** Seiteninhalte (deutsch). Jede Sachaussage hat eine Quelle in quellen/ oder steht im Code des Viewers. */
import { SITE, esc, href, url, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, articleLd, personLd, mdr, tools } from "./layout.mjs";

export const S = {
  vhitg: ["VHitG-Arztbrief-Leitfaden v1.50 (HL7 Deutschland)", "https://download.hl7.de/documents/cdar2-arztbrief/Leitfaden-VHitG-Arztbrief-v150.pdf"],
  kbv: ["KBV, Richtlinie elektronischer Brief (in Kraft seit 17.05.2024)", "https://www.kbv.de/documents/infothek/rechtsquellen/weitere-vertraege/praxen/telemedizin/rl-earztbrief.pdf"],
  kbvSeite: ["KBV, eArztbrief: Versand, Empfang und technische Voraussetzungen", "https://www.kbv.de/praxis/digitalisierung/anwendungen/earztbrief"],
  hl7de: ["HL7 Deutschland, Downloads", "https://hl7.de/downloads/"],
  chrome: ["Chrome for Developers, Removing XSLT for a more secure browser", "https://developer.chrome.com/docs/web-platform/deprecating-xslt"],
  ccda: ["HL7 International, Consolidated CDA (C-CDA) v5.0.0, IG Home", "https://hl7.org/cda/us/ccda/"],
  ccdaEx: ["HL7/C-CDA-Examples auf GitHub (CC0 1.0)", "https://github.com/HL7/C-CDA-Examples"],
  fhirDoc: ["HL7 International, FHIR Documents", "https://www.hl7.org/fhir/documents.html"],
};
const a = (k) => `<a href="${S[k][1]}">${esc(S[k][0])}</a>`;
const src = (...keys) => `<p class="src">Quelle${keys.length > 1 ? "n" : ""}: ${keys.map(a).join("; ")}. Stand ${SITE.updatedDe}.</p>`;
const L = (p, t) => `<a href="${href(p)}">${t}</a>`;
const code = (s) => `<code>${esc(s)}</code>`;
const pre = (s) => `<pre class="code"><code>${esc(s)}</code></pre>`;

export const SAMPLES = [
  { id: "de-arztbrief-entlassbrief", file: "de-arztbrief-entlassbrief.xml", title: "Entlassbrief (fiktiv, Deutsch)", badge: "Eigenes Beispiel", source: "Eigenes, frei erfundenes Beispiel von Thomas Freimoser (MIT-Lizenz). Keine echten Patientendaten.", license: "MIT", text: "Fiktiver Krankenhaus-Entlassbrief in der Struktur eines deutschen Arztbriefs: Kopf mit Patientin, Autor und Verwahrer, Abschnitte mit Text und LOINC-Code, keine codierten Einträge (Level 2)." },
  { id: "de-arztbrief-facharzt-level3", file: "de-arztbrief-facharzt-level3.xml", title: "Facharztbrief mit Messwerten (fiktiv, Deutsch)", badge: "Eigenes Beispiel", source: "Eigenes, frei erfundenes Beispiel von Thomas Freimoser (MIT-Lizenz). Keine echten Patientendaten.", license: "MIT", text: "Fiktiver ambulanter Facharztbrief mit Level-3-Einträgen: Blutdruck, Herzfrequenz und Körpergewicht als Vitalwerte-Organizer sowie Laborwerte, jeweils mit Verweis auf die Tabellenzelle im Text." },
  { id: "hl7-ccda-ccd", file: "hl7-ccda-ccd.xml", title: "Continuity of Care Document (C-CDA R2.1)", badge: "HL7 C-CDA-Examples, CC0", source: "HL7/C-CDA-Examples, C-CDA_R2_CCD_2.xml, Commit ad5007a, CC0 1.0. Eine E-Mail-Adresse wurde durch isabella.jones@example.org ersetzt.", license: "CC0 1.0", text: "US-amerikanisches Beispiel eines CCD aus dem Repository HL7/C-CDA-Examples. Englisch, mit codierten Einträgen." },
  { id: "hl7-ccda-discharge-summary", file: "hl7-ccda-discharge-summary.xml", title: "Discharge Summary (C-CDA R2.1)", badge: "HL7 C-CDA-Examples, CC0", source: "HL7/C-CDA-Examples, C-CDA_R2_Discharge_Summary.xml, Commit ad5007a, CC0 1.0.", license: "CC0 1.0", text: "Entlassbericht aus dem C-CDA-Beispielrepository: englischsprachig, mit Aufnahmediagnose, Allergien und weiteren Abschnitten." },
  { id: "hl7-ccda-consultation-note", file: "hl7-ccda-consultation-note.xml", title: "Consultation Note (C-CDA R2.1)", badge: "HL7 C-CDA-Examples, CC0", source: "HL7/C-CDA-Examples, C-CDA_R2_Consultation_Note.xml, Commit ad5007a, CC0 1.0.", license: "CC0 1.0", text: "Konsiliarbericht aus dem C-CDA-Beispielrepository, das größte der Beispiele (rund 90 KB), mit Tabellen im Text und codierten Einträgen." },
];

const stat = (st, id) => st[id] || { sections: "?", entries: "?", level: "?" };

export function samplesCards(st) {
  return `<div class="grid c3">
${SAMPLES.map((s) => { const x = stat(st, s.id); return `<article class="card sample">
<span class="badge">${esc(s.badge)}</span>
<h3>${esc(s.title)}</h3>
<p>${esc(s.text)}</p>
<p class="small">${x.sections} Abschnitte, ${x.entries} Einträge, vom Viewer als Level ${x.level} geschätzt. Lizenz: ${esc(s.license)}. ${esc(s.source)}</p>
<div class="btns"><button class="btn pri" type="button" data-sample="${s.id}">Im Viewer öffnen</button><a class="btn" href="${href("beispiele/" + s.file)}" download>XML laden</a></div>
</article>`; }).join("\n")}
</div>`;
}

const toolCards = (status, variant = 0) => `<section class="tools2" aria-labelledby="werkzeuge"><h2 id="werkzeuge">Weitere Werkzeuge</h2>
<p>Andere Datenformate aus dem Gesundheitswesen, ebenfalls lokal im Browser:</p>
<ul class="toollist">
${tools(status, variant).map((t) => `<li><a href="${t.u}">${esc(t.t)}</a> – ${esc(t.d)}</li>`).join("\n")}
</ul>
<p class="small">Überblick über die Formate: <a href="https://freimoser.github.io/dicom-viewer/medizinische-datenformate/">Medizinische Datenformate: DICOM, LDT, BDT, GDT</a>.</p>
</section>`;

// ---------------------------------------------------------------- FAQ
export const FAQ = [
  { q: "Was ist ein HL7-CDA-Dokument?", a: `<p>CDA (Clinical Document Architecture) ist ein XML-Standard von HL7 International für klinische Dokumente wie Arztbriefe oder Entlassbriefe. Ein CDA-Dokument besteht aus einem Header mit Patient, Autor, Dokumenttyp und Datum sowie einem Body aus Abschnitten mit lesbarem Text und optional codierten Einträgen. Mehr dazu unter ${L("was-ist-cda/", "Was ist HL7 CDA?")}.</p>` },
  { q: "Wie öffne ich eine CDA-XML-Datei lesbar?", a: `<p>Ziehen Sie die Datei in das Feld oben oder fügen Sie den XML-Text ein. Der Viewer zeigt Kopf, Abschnitte und Text an; mit „Strukturdaten“ sehen Sie die codierten Einträge als Tabelle, mit „Roh-XML“ den Quelltext. Eine Anleitung mit den Fehlermeldungen des Viewers steht unter ${L("cda-datei-oeffnen/", "CDA-Datei öffnen")}.</p>` },
  { q: "Ist HL7 v3 dasselbe wie CDA?", a: `<p>Nicht ganz. CDA Release 2 gehört zur „Familie“ der HL7-Version-3-Standards und beruht auf dem HL7-Referenz-Informationsmodell (RIM) (Quelle: ${a("vhitg")}). Mit v3-Nachrichten, die Daten zwischen Systemen austauschen, ist ein CDA-Dokument nicht identisch. Erkennt der Viewer ein v3-Nachrichtenelement als Wurzel, meldet er „Kein CDA-Dokument“ und nennt das gefundene Element.</p>` },
  { q: "Was bedeuten Level 1, 2 und 3 beim Arztbrief?", a: `<p>Level 1 ist ein lesbares XML-Dokument ohne codierte Struktur, Level 2 kennzeichnet zusätzlich die Abschnitte mit Codes, Level 3 enthält maschinenauswertbare Einzelinformationen (entry) (Quelle: ${a("vhitg")}, Kapitel 6.2). Der Viewer schätzt das Level aus dem Dokument; das ist ein Hinweis, keine Konformitätsaussage. Details: ${L("cda-arztbrief-lesen/", "Arztbrief lesen")}.</p>` },
  { q: "Ist der eArztbrief ein CDA-Dokument?", a: `<p>Die KBV-Richtlinie zum elektronischen Brief (in Kraft seit 17.05.2024) verlangt mindestens eine PDF/A-Datei und eine XML-Datei nach dem Implementierungsleitfaden „Arztbrief“ auf Basis von HL7 CDA Release 2, Version 1.50 vom 12.05.2006. Die XML-Datei darf sich auf Patient und Absender beschränken, der Body darf leer sein; der Inhalt steht dann im PDF (Quelle: ${a("kbv")}). Ein solcher Brief erscheint im Viewer mit Kopf und ohne Abschnitte.</p>` },
  { q: "Wird meine Datei hochgeladen?", a: `<p>Nein. Die Datei wird im Browser gelesen und dort verarbeitet. Die Seite setzt eine Content-Security-Policy mit <code>connect-src 'none'</code>, der Browser blockiert damit Netzwerkverbindungen der Seite selbst. Dateien mit DOCTYPE- oder ENTITY-Deklaration lehnt der Viewer aus Sicherheitsgründen ab. Mehr unter ${L("datenschutz/", "Datenschutz")}.</p>` },
  { q: "Prüft der Viewer, ob ein CDA-Dokument gültig ist?", a: `<p>Nein. Der Viewer zeigt Plausibilitätshinweise, etwa fehlende Kopfbestandteile oder Text-Verweise ohne Ziel. Er führt keine Schema- oder Schematron-Prüfung gegen einen Leitfaden aus, prüft keine Signaturen und ist kein Medizinprodukt. Für eine Konformitätsprüfung brauchen Sie einen Validator, der die Regeln des jeweiligen Leitfadens umsetzt.</p>` },
];

// ---------------------------------------------------------------- Startseite
export function indexPage(st, toolStatus) {
  const path = "";
  const p = {
    path,
    title: "Viewer für HL7 CDA-Arztbriefe – CDA-XML online ansehen",
    description: "HL7 CDA Viewer online: CDA-XML (Arztbrief, C-CDA) im Browser lesen – Kopf, Abschnitte, Text und Entries. Kostenlos, ohne Upload, ohne XSLT.",
    ogTitle: "HL7 CDA Viewer online – Arztbrief und CDA-XML im Browser lesen",
    scripts: ["assets/js/menu.mjs", "assets/js/app.mjs"],
  };
  p.jsonld = [
    { "@context": "https://schema.org", "@type": ["WebApplication", "HealthApplication"], name: "CDA-Viewer", alternateName: "HL7 CDA Viewer", url: url(), description: p.description, applicationCategory: "HealthApplication", operatingSystem: "Alle Systeme mit aktuellem Webbrowser", browserRequirements: "JavaScript, aktueller Browser", inLanguage: "de-DE", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, featureList: ["HL7 CDA R2 und C-CDA lesbar anzeigen", "Kopf, Abschnitte und Narrativtext", "Codierte Einträge (Level 3) als Tabelle", "Roh-XML und Druckansicht", "Verarbeitung nur im Browser, kein Upload"], author: personLd(), datePublished: SITE.updated, dateModified: SITE.updated, image: url("og-image.png") },
    faqLd(FAQ),
    breadcrumbLd([["CDA-Viewer", ""]]),
  ];
  p.body = `<div class="crumbs"></div>
<h1>Viewer für HL7 CDA-Arztbriefe: CDA-XML im Browser lesen</h1>
<p class="lead">Dieser CDA-Viewer zeigt Dokumente nach HL7 CDA R2 (Clinical Document Architecture) lesbar an, zum Beispiel Arztbriefe, Entlassbriefe und C-CDA-Dokumente: den Kopf mit Patient, Autor und Verwahrer, die Abschnitte mit ihrem Text und die codierten Einträge. Ihre Datei wird nur in Ihrem Browser gelesen.</p>
${mdr()}
<section id="viewer" aria-labelledby="tool">
<h2 id="tool">CDA-Datei öffnen</h2>
<div class="drop" id="drop">
<p><strong>CDA-XML-Datei hierher ziehen</strong> oder auswählen</p>
<div class="btns"><label class="btn pri">Datei auswählen<input type="file" id="file" accept=".xml,.cda,.txt,text/xml,application/xml"></label></div>
</div>
<details class="paste"><summary>XML-Text einfügen</summary>
<label class="small" for="paste">CDA-XML hier einfügen</label>
<textarea id="paste" spellcheck="false" autocomplete="off" placeholder="&lt;ClinicalDocument xmlns=&quot;urn:hl7-org:v3&quot; …"></textarea>
<div class="btns"><button class="btn pri" type="button" id="paste-go">Anzeigen</button><button class="btn" type="button" id="paste-clear">Leeren</button></div>
</details>
<p class="status" id="status" role="status" aria-live="polite"></p>
<p class="sampleinfo" id="sampleinfo" hidden></p>
<div class="viewbar" id="viewbar" role="group" aria-label="Ansicht" hidden>
<button class="btn sm on" type="button" data-mode="doc">Dokument</button>
<button class="btn sm" type="button" data-mode="data">Strukturdaten</button>
<button class="btn sm" type="button" data-mode="raw">Roh-XML</button>
<button class="btn sm" type="button" id="print">Druckansicht</button>
</div>
<div id="output"></div>
<noscript><p class="errbox">Der Viewer braucht JavaScript, weil er die Datei im Browser verarbeitet. Es wird nichts an einen Server gesendet.</p></noscript>
</section>
<section class="samples" id="beispiele" aria-labelledby="bsp">
<h2 id="bsp">Beispiele zum Ausprobieren</h2>
<p>Fünf kleine Beispieldokumente liegen direkt in der Seite, es wird nichts nachgeladen. Zwei sind eigene, frei erfundene deutsche Arztbriefe, drei stammen aus dem Beispielrepository der C-CDA-Arbeitsgruppe von HL7 (CC0 1.0). Die Herkunft steht an jeder Karte und in den ${L("quellen/", "Quellen")}. Die Beispiele enthalten keine echten Patientendaten.</p>
${samplesCards(st)}
</section>
<section class="intro" aria-labelledby="funktion">
<h2 id="funktion">Was der Viewer anzeigt</h2>
<div class="content">
<ul>
<li><strong>Dokument:</strong> Titel, Kopf (Dokumenttyp, Datum, Patient, Autor, Verwahrer, Empfänger, Unterzeichner), ein Inhaltsverzeichnis der Abschnitte und den Text jedes Abschnitts mit Tabellen, Listen und Textauszeichnungen.</li>
<li><strong>Strukturdaten:</strong> der Kopf als Tabelle und alle codierten Einträge (entry) je Abschnitt mit Code, Wert, Einheit, Zeit und Status.</li>
<li><strong>Roh-XML:</strong> der Quelltext, wahlweise eingerückt.</li>
<li><strong>Druckansicht:</strong> druckt nur das dargestellte Dokument, ohne Navigation. Über den Druckdialog des Browsers lässt es sich als PDF sichern.</li>
<li><strong>Plausibilitätshinweise:</strong> zum Beispiel fehlende Kopfbestandteile, abweichende typeId, Abschnitte ohne Inhalt oder Text-Verweise ohne Ziel. Das ist keine Schematron-Prüfung.</li>
</ul>
<p>Der Viewer arbeitet ohne XSLT: Er liest das Dokument mit dem XML-Parser des Browsers (DOMParser) und baut die Ansicht selbst auf. Warum das wichtig ist, steht unter ${L("cda-datei-oeffnen/#xslt", "CDA-Datei öffnen")}.</p>
</div>
</section>
<section aria-labelledby="grenzen">
<h2 id="grenzen">Grenzen</h2>
<div class="content">
<ul>
<li>Kein Medizinprodukt und keine klinische Bewertung. Der Viewer prüft keine Inhalte auf medizinische Richtigkeit.</li>
<li>Keine Schema-, Schematron- oder Leitfaden-Validierung und keine Signaturprüfung.</li>
<li>Ein in der Datei eingetragenes Stylesheet (<code>xml-stylesheet</code>) wird ignoriert. Die Darstellung ist die des Viewers, nicht die des Erzeugersystems.</li>
<li>Eingebettete Medien (<code>renderMultiMedia</code>) und ein <code>nonXMLBody</code> mit PDF werden nicht angezeigt; der Viewer markiert die Stelle.</li>
<li>Dateien über 15 MB und Dateien mit DOCTYPE- oder ENTITY-Deklaration werden abgelehnt.</li>
<li>Codes werden so angezeigt, wie sie in der Datei stehen (Code, Codesystem, Anzeigename). Der Viewer übersetzt keine Codes und enthält nur eine kleine Liste bekannter Codesystem-OIDs.</li>
</ul>
</div>
</section>
<section aria-labelledby="weiter">
<h2 id="weiter">Weiterlesen</h2>
<div class="grid c3">
<a class="card-link" href="${href("cda-datei-oeffnen/")}"><h3>CDA-Datei öffnen</h3><p>Warum eine CDA-XML-Datei im Browser unlesbar wirkt und welche Fehlermeldungen was bedeuten.</p></a>
<a class="card-link" href="${href("cda-arztbrief-lesen/")}"><h3>Arztbrief lesen</h3><p>Aufbau eines Arztbriefs nach HL7 CDA: Kopf, Abschnitte, Level und eArztbrief.</p></a>
<a class="card-link" href="${href("was-ist-cda/")}"><h3>Was ist HL7 CDA?</h3><p>CDA, C-CDA, HL7 v3 und FHIR: wie die Begriffe zusammenhängen.</p></a>
</div>
</section>
${faqHtml(FAQ)}
${toolCards(toolStatus)}`.replace('<div class="crumbs"></div>\n', "");
  return p;
}

// ---------------------------------------------------------------- CDA-Datei öffnen
export function openPage(toolStatus) {
  const path = "cda-datei-oeffnen/";
  const crumbs = [["CDA-Viewer", ""], ["CDA-Datei öffnen", path]];
  const p = { path, title: "HL7 CDA-Datei öffnen: XML lesbar anzeigen (Anleitung)", description: "HL7 CDA-Datei öffnen: Warum XML ohne Stylesheet unlesbar wirkt, wie Sie sie im Browser lesen und was die Fehlermeldungen bedeuten.", ogType: "article" };
  p.jsonld = [
    articleLd(p, "HL7 CDA-Datei öffnen: so wird aus XML ein lesbarer Arztbrief"),
    { "@context": "https://schema.org", "@type": "HowTo", name: "CDA-XML-Datei im Browser lesen", step: [
      { "@type": "HowToStep", name: "Datei prüfen", text: "Öffnen Sie die Datei in einem Texteditor und prüfen Sie, ob sie mit dem Element ClinicalDocument im Namensraum urn:hl7-org:v3 beginnt." },
      { "@type": "HowToStep", name: "Im Viewer öffnen", text: "Ziehen Sie die Datei in den CDA-Viewer oder fügen Sie den XML-Text ein." },
      { "@type": "HowToStep", name: "Ansicht wählen", text: "Wechseln Sie zwischen Dokument, Strukturdaten und Roh-XML." },
      { "@type": "HowToStep", name: "Hinweise lesen", text: "Lesen Sie die Plausibilitätshinweise zu fehlenden Bestandteilen." },
      { "@type": "HowToStep", name: "Drucken", text: "Nutzen Sie die Druckansicht und speichern Sie das Ergebnis im Druckdialog als PDF." },
    ] },
    breadcrumbLd(crumbs),
  ];
  p.body = `${breadcrumbHtml(crumbs)}
<h1>HL7 CDA-Datei öffnen: so wird aus XML ein lesbarer Arztbrief</h1>
<p class="lead">Eine CDA-Datei ist XML. Ohne passendes Stylesheet zeigt der Browser nur den Elementbaum oder nackten Text. Mit dem ${L("", "CDA-Viewer")} lesen Sie Kopf, Abschnitte und Einträge, ohne etwas zu installieren oder hochzuladen.</p>
${mdr()}
<div class="content">
<h2>In fünf Schritten</h2>
<ol class="steps">
<li><h3>Datei erkennen</h3><p>Die Dateiendung allein sagt nichts über den Inhalt. Öffnen Sie die Datei in einem Texteditor: Sie muss mit dem Element <code>ClinicalDocument</code> im Namensraum <code>urn:hl7-org:v3</code> beginnen.</p>${pre(`<?xml version="1.0" encoding="UTF-8"?>\n<ClinicalDocument xmlns="urn:hl7-org:v3">\n  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>\n  <id root="…" extension="…"/>\n  <code code="…" codeSystem="2.16.840.1.113883.6.1"/>\n  …\n</ClinicalDocument>`)}</li>
<li><h3>Im Viewer öffnen</h3><p>Ziehen Sie die Datei in das Feld auf der ${L("#viewer", "Startseite")}, wählen Sie sie aus oder fügen Sie den XML-Text ein. Die Datei wird nicht übertragen.</p></li>
<li><h3>Ansicht wählen</h3><p>„Dokument“ zeigt den Brief mit Inhaltsverzeichnis. „Strukturdaten“ listet Kopf und codierte Einträge als Tabellen. „Roh-XML“ zeigt den Quelltext, wahlweise eingerückt.</p></li>
<li><h3>Hinweise lesen</h3><p>Über dem Dokument stehen Plausibilitätshinweise, etwa wenn Kopfbestandteile fehlen. Sie ersetzen keine Validierung.</p></li>
<li><h3>Drucken oder als PDF sichern</h3><p>„Druckansicht“ öffnet den Druckdialog des Browsers. Gedruckt wird nur das Dokument. Wählen Sie dort „Als PDF speichern“, wenn Sie eine Datei brauchen.</p></li>
</ol>
<h2>Warum eine CDA-Datei im Browser unlesbar aussieht</h2>
<p>CDA trennt Inhalt und Darstellung. Der Standard verlangt, dass jedes Dokument seine klinischen Informationen in lesbarer Form enthält, und dass sich der Inhalt mit „einem einzigen Stylesheet und marktüblichen Browsern“ darstellen lässt (Quelle: ${a("vhitg")}, Kapitel 3.3.6). Die Darstellung selbst liefert die Datei nicht mit. Die Datei kann über die Verarbeitungsanweisung <code>xml-stylesheet</code> mit einem XSL-Stylesheet verknüpft sein. Die drei C-CDA-Beispiele von HL7 im Viewer enthalten genau diese Zeile mit <code>href="CDA.xsl"</code>. Liegt das Stylesheet nicht neben der Datei, bleibt dem Browser nur der Elementbaum.</p>
<h2 id="xslt">Warum dieser Viewer ohne XSLT arbeitet</h2>
<p>Chromium hat XSLT (einschließlich der <code>XSLTProcessor</code>-API und der Verarbeitungsanweisung <code>xml-stylesheet</code>) offiziell als veraltet erklärt. Nach der Planung von Chrome stoppt XSLT in Chrome 158 am 17. November 2026 für alle Nutzer außer Teilnehmern des Origin Trials und einer Enterprise Policy, in Chrome 176 am 17. August 2027 für alle. Firefox und WebKit haben ebenfalls Pläne zur Entfernung angedeutet (Quelle: ${a("chrome")}). Ein Verfahren, das nur auf einem Stylesheet im Browser beruht, kann damit ausfallen.</p>
<p>Der CDA-Viewer liest die Datei deshalb mit dem XML-Parser des Browsers (<code>DOMParser</code>) und erzeugt die Ansicht mit eigenem Code. Das hat zwei Folgen: Er braucht kein Stylesheet, und er kann den Text der Abschnitte streng filtern. Aus dem Narrativtext übernimmt er nur eine feste Liste von Elementen (Absätze, Listen, Tabellen, Hervorhebungen, Links mit http, https oder mailto). Skripte, Formulare, Bilder und unbekannte Elemente erscheinen nicht; bei unbekannten Elementen bleibt nur der Text.</p>
<h2 id="fehler">Fehlermeldungen und was sie bedeuten</h2>
<p>Die Meldungen unten stammen aus dem Viewer. Fehler erscheinen als Klartext im Statusbereich über der Ansicht, nicht als Skriptfehler.</p>
<dl class="errlist">
<dt>${code("Die Datei ist kein wohlgeformtes XML.")}</dt>
<dd>Der Viewer prüft zuerst selbst auf bestimmte Fehler (nicht geschlossene Elemente, nacktes <code>&amp;</code>, fehlendes Wurzelelement) und nennt Zeile und Spalte. Bei anderen Fehlern gilt die Meldung des XML-Parsers im Browser. Mögliche Ursachen: abgeschnittene Datei, nicht maskierte Zeichen wie <code>&amp;</code> oder <code>&lt;</code> im Text, oder die Datei ist gar kein XML (zum Beispiel ein PDF oder eine HL7-v2-Nachricht mit senkrechten Strichen).</dd>
<dt>${code("Kein CDA-Dokument: Wurzelelement ist „Bundle“.")}</dt>
<dd>Das Wurzelelement ist nicht <code>ClinicalDocument</code>. Bei <code>Bundle</code> oder <code>Composition</code> handelt es sich um FHIR, bei Elementen wie <code>PRPA_IN201301UV02</code> um eine HL7-v3-Nachricht. Beides sind keine CDA-Dokumente. Zum Unterschied siehe ${L("was-ist-cda/", "Was ist HL7 CDA?")}.</dd>
<dt>${code("Die Datei enthält eine DOCTYPE- oder ENTITY-Deklaration und wird nicht geladen.")}</dt>
<dd>CDA-Dokumente brauchen keine DOCTYPE-Deklaration. Der Viewer lädt solche Dateien nicht, um Angriffe über Entity-Expansion auszuschließen. Entfernen Sie die Zeile, wenn Sie der Datei vertrauen.</dd>
<dt>${code("Die Datei ist größer als 15 MB.")}</dt>
<dd>Der Viewer ist für Dokumente im Bereich weniger Megabyte gedacht. Große Dateien können eingebettete Anhänge enthalten, etwa ein PDF in einem <code>nonXMLBody</code>.</dd>
<dt>${code("Das Wurzelelement liegt nicht im Namensraum „urn:hl7-org:v3“")}</dt>
<dd>Das Dokument heißt zwar <code>ClinicalDocument</code>, hat aber keinen oder einen anderen Namensraum. Der Viewer zeigt es trotzdem an und warnt. Prüfen Sie das Attribut <code>xmlns</code> am Wurzelelement.</dd>
<dt>${code("Der structuredBody enthält keine Abschnitte (section).")}</dt>
<dd>Kein Fehler im Viewer: Das Dokument hat einen Body ohne Abschnitte. Beim eArztbrief nach KBV-Richtlinie ist das erlaubt, der Inhalt steht dann im PDF/A. Mehr unter ${L("cda-arztbrief-lesen/#earztbrief", "Arztbrief lesen")}.</dd>
<dt>${code("Der Body ist ein nonXMLBody …")}</dt>
<dd>Der Inhalt steckt als eingebettetes Dokument im XML. Der Viewer zeigt nur den Kopf und markiert die Stelle.</dd>
<dt>${code("… Text-Verweis(e) (reference value=\"#…\") zeigen auf eine ID, die im Dokument nicht vorkommt.")}</dt>
<dd>Ein codierter Eintrag verweist auf eine Stelle im Text, die es nicht gibt. Das deutet auf einen Fehler im erzeugenden System hin. Der Viewer zeigt die Daten trotzdem an.</dd>
</dl>
<h2>Andere XML-Formate im Browser lesen</h2>
<p>Ist Ihre Datei FHIR statt CDA, eine HL7-v2-Nachricht oder eine E-Rechnung, finden Sie unten passende Werkzeuge.</p>
</div>
${toolCards(toolStatusLimited(toolStatus), 1)}`;
  return p;
}
function toolStatusLimited(s) { return s; }

// ---------------------------------------------------------------- Arztbrief lesen
export function arztbriefPage(toolStatus) {
  const path = "cda-arztbrief-lesen/";
  const crumbs = [["CDA-Viewer", ""], ["Arztbrief lesen", path]];
  const p = { path, title: "HL7 CDA-Arztbrief lesen: Aufbau, Level und eArztbrief", description: "Aufbau eines Arztbriefs nach HL7 CDA R2: Kopf, Abschnitte, LOINC-Codes, Level 1 bis 3, Entries und der eArztbrief nach KBV-Richtlinie.", ogType: "article" };
  p.jsonld = [articleLd(p, "HL7 CDA-Arztbrief lesen: Kopf, Abschnitte und Einträge erklärt"), breadcrumbLd(crumbs)];
  p.body = `${breadcrumbHtml(crumbs)}
<h1>HL7 CDA-Arztbrief lesen: Kopf, Abschnitte und Einträge erklärt</h1>
<p class="lead">Ein Arztbrief als HL7-CDA-Dokument folgt in Deutschland dem „Implementierungsleitfaden Arztbrief auf Basis der HL7 Clinical Document Architecture, Release 2, für das deutsche Gesundheitswesen“. Diese Seite zeigt, woraus ein solches Dokument besteht und woran Sie es im ${L("", "CDA-Viewer")} erkennen. Probieren Sie die zwei fiktiven Beispiele aus: ${L("#beispiel=de-arztbrief-entlassbrief", "Entlassbrief")} und ${L("#beispiel=de-arztbrief-facharzt-level3", "Facharztbrief mit Messwerten")}.</p>
${mdr()}
<div class="content">
<h2>Welche Spezifikation?</h2>
<p>Der VHitG-Leitfaden Version 1.50 (Stand 12.05.2006, Dokumenten-OID 1.2.276.0.76.3.1.13.7.5) ist die Grundlage der Arztbriefe nach CDA R2 in Deutschland. HL7 Deutschland führt ihn auf der Download-Seite als „Arztbrief 2006 (VHitG-Arztbrief v1.50)“ und nennt als Nachfolger den „Arztbrief 2014/2015“ (Quellen: ${a("vhitg")}; ${a("hl7de")}). Welche Version ein Dokument verwendet, steht in dessen <code>templateId</code>. Der Viewer zeigt sie im Kopf an, prüft sie aber nicht gegen einen Leitfaden.</p>
<h2>Der Kopf (Header)</h2>
<p>Der Kopf beschreibt das Dokument und seine Beteiligten. Die Kardinalitäten stammen aus dem VHitG-Leitfaden v1.50 (Spalte „Leitfaden“); die Spalte „Im Viewer“ beschreibt, wo Sie das Element finden.</p>
<div class="tablewrap"><table>
<thead><tr><th>Element</th><th>Bedeutung</th><th>Leitfaden</th><th>Im Viewer</th></tr></thead>
<tbody>
<tr><td>${code("id")}</td><td>Dokumenten-ID</td><td>1..1</td><td>Kopf</td></tr>
<tr><td>${code("code")}</td><td>Dokumenttyp (LOINC)</td><td>1..1</td><td>Kopf, Zeile „Dokumenttyp“</td></tr>
<tr><td>${code("title")}</td><td>zusätzliche Bezeichnung</td><td>0..1</td><td>Titel</td></tr>
<tr><td>${code("effectiveTime")}</td><td>Erstellungsdatum</td><td>1..1</td><td>Kopf, als Datum formatiert</td></tr>
<tr><td>${code("confidentialityCode")}</td><td>Vertraulichkeitsgrad</td><td>1..1</td><td>Kopf</td></tr>
<tr><td>${code("languageCode")}</td><td>Sprache</td><td>0..1</td><td>Kopf</td></tr>
<tr><td>${code("recordTarget")}</td><td>Patient: Kennung (1..*), Name, Geburtsdatum, Geschlecht, Adresse</td><td>Kennung 1..*</td><td>Karte „Patient“</td></tr>
<tr><td>${code("author")}</td><td>Autor mit Zeitpunkt (1..1) und Kennung (1..*)</td><td>siehe links</td><td>Karte „Autor“</td></tr>
<tr><td>${code("custodian")}</td><td>für die Verwaltung verantwortliche Organisation, Kennung (1..*)</td><td>Kennung 1..*</td><td>Karte „Verwahrer“</td></tr>
<tr><td>${code("legalAuthenticator")}</td><td>Unterzeichner mit Zeitpunkt und signatureCode</td><td>siehe Leitfaden</td><td>Karte „Rechtlich Unterzeichnender“</td></tr>
</tbody></table></div>
${src("vhitg")}
<h2>Dokumenttypen</h2>
<p>Der Dokumenttyp steht als LOINC-Code im Element <code>code</code> (Codesystem-OID 2.16.840.1.113883.6.1). Für Entlassbriefe nennt der Leitfaden die „Discharge summarization notes“ (Auszug):</p>
<div class="tablewrap"><table>
<thead><tr><th>Code</th><th>Deutsche Bezeichnung</th><th>Berufsgruppe, Umgebung</th></tr></thead>
<tbody>
<tr><td>34106-5</td><td>Zusammenfassung bei Entlassung</td><td>Arzt, Krankenhaus</td></tr>
<tr><td>34105-7</td><td>Zusammenfassung bei Entlassung</td><td>Heilberufler, Krankenhaus</td></tr>
<tr><td>11490-0</td><td>Zusammenfassung bei Entlassung</td><td>Arzt, ambulante Versorgung</td></tr>
<tr><td>18842-5</td><td>Zusammenfassung bei Entlassung</td><td>Heilberufler, ambulante Versorgung</td></tr>
<tr><td>28616-1</td><td>Verlegungsbrief / Zusammenfassung bei Verlegung</td><td>Arzt, ambulante Versorgung</td></tr>
<tr><td>18733-6</td><td>Bericht über ambulanten Besuch</td><td>ohne Angabe</td></tr>
<tr><td>11488-4</td><td>Konsilbericht</td><td>ohne Angabe</td></tr>
</tbody></table></div>
${src("vhitg")}
<h2>Abschnitte und Narrativtext</h2>
<p>Der Body besteht aus Abschnitten (<code>section</code>), die auch ineinander geschachtelt sein können. Jeder Abschnitt enthält verpflichtend einen Text, den narrativen Block; das ist die menschenlesbare Fassung. Im Text sind unter anderem Absätze, Listen, Tabellen, Zeilenumbrüche, Hervorhebungen, Hoch- und Tiefstellung möglich (Quelle: ${a("vhitg")}). Ab Level 2 trägt jeder Abschnitt einen LOINC-Code. Eine Auswahl aus der Tabelle des Leitfadens:</p>
<div class="tablewrap"><table>
<thead><tr><th>Code</th><th>Bezeichnung im Leitfaden</th></tr></thead>
<tbody>
<tr><td>11450-4</td><td>Liste der Probleme</td></tr>
<tr><td>29548-5</td><td>Diagnose (Text)</td></tr>
<tr><td>29308-4</td><td>Diagnose (Codiert)</td></tr>
<tr><td>10164-2</td><td>Jetzige Anamnese</td></tr>
<tr><td>8648-8</td><td>Verlauf im Krankenhaus</td></tr>
<tr><td>10183-2</td><td>Medikamente bei Entlassung</td></tr>
<tr><td>10155-0</td><td>Allergie-Anamnese</td></tr>
<tr><td>8716-3</td><td>Vitalparameter, körperliche Untersuchung</td></tr>
<tr><td>18776-5</td><td>Behandlungsplan, weiteres Vorgehen</td></tr>
</tbody></table></div>
${src("vhitg")}
<h2 id="level">Level 1, 2 und 3</h2>
<ul>
<li><strong>Level 1:</strong> ein XML-Dokument, das auf „menschliche Interoperabilität“ zielt. Es gibt keine Einschränkung für Inhalt und Zweck.</li>
<li><strong>Level 2:</strong> die Abschnitte sind zusätzlich durch Codes klassifiziert, in der Arztbrief-Spezifikation durch LOINC-Codes.</li>
<li><strong>Level 3:</strong> zusätzlich enthalten die Abschnitte maschinenauswertbare Einzelinformationen (entry), etwa einen systolischen Blutdruck als Beobachtung. Eine Anwendung kann damit einzelne Beobachtungen, Prozeduren oder Medikationen identifizieren und verarbeiten.</li>
</ul>
${src("vhitg")}
<p>Der Viewer schätzt das Level so: Gibt es mindestens ein <code>entry</code>, nimmt er Level 3 an; gibt es codierte Abschnitte ohne Einträge, Level 2; sonst Level 1. Das ist eine Heuristik, kein Konformitätsnachweis.</p>
<h2>Text und Einträge zusammen lesen</h2>
<p>Die Ansicht „Dokument“ zeigt den Narrativtext, „Strukturdaten“ die Einträge. Im Level-3-Beispiel steht ein Blutdruck in einer Tabellenzelle des Textes und als Beobachtung im Eintrag. Eine Referenz im Eintrag verweist auf die Zelle (gekürzt aus dem Beispiel):</p>
${pre(`<td ID="bd1">148/92 mm[Hg]</td>   <!-- Narrativtext -->\n…\n<observation classCode="OBS" moodCode="EVN">\n  <code code="8480-6" codeSystem="2.16.840.1.113883.6.1"/>\n  <text><reference value="#bd1"/></text>\n  <value xsi:type="PQ" value="148" unit="mm[Hg]"/>\n</observation>`)}
<p>Laut Leitfaden bezieht sich die Lesbarkeit auf den authentifizierten Inhalt; zusätzliche Informationen für Anwendungssysteme müssen weder authentifiziert noch lesbar dargestellt werden, und es muss beschrieben sein, wie strukturierte Inhalte aus dem Text abgeleitet wurden oder umgekehrt (Quelle: ${a("vhitg")}, Kapitel 3.3.6). Der Viewer zeigt Text und Einträge getrennt und warnt, wenn ein Verweis ins Leere läuft.</p>
<h2 id="earztbrief">eArztbrief nach KBV-Richtlinie</h2>
<p>In der vertragsärztlichen Versorgung regelt die KBV-Richtlinie zum elektronischen Brief (gemäß § 383 SGB V, in Kraft seit 17.05.2024) den Inhalt: Der Brief muss mindestens eine Datei im Format PDF/A und eine XML-Datei nach dem VHitG-Arztbrief-Leitfaden v1.50 enthalten. Das PDF muss alle zum Arztbrief gehörenden Informationen enthalten. Die XML-Datei darf sich auf Informationen zu Patient und Absenderorganisation beschränken, der <code>body</code> darf leer sein. Vor dem Versand muss der Arzt den Brief mit dem elektronischen Heilberufsausweis qualifiziert signieren (Quelle: ${a("kbv")}).</p>
<p>Versendet wird der eArztbrief laut KBV über den E-Mail-Dienst KIM; seit 30. Juni 2024 müssen Praxen ihn mindestens empfangen können (Quelle: ${a("kbvSeite")}). Wie Praxissoftware an solche Dienste angebunden wird, ist Sache der Hersteller.${SITE.flexchange.enabled ? " " + SITE.flexchange.html : ""}</p>
<p>Für den Viewer folgt daraus: Ein eArztbrief erscheint mit Kopf und ohne Abschnitte, der Hinweis „Der structuredBody enthält keine Abschnitte“ ist dann kein Fehler. Das PDF/A wird nicht angezeigt; öffnen Sie es mit einem PDF-Programm.</p>
<h2>Was der Viewer bei Arztbriefen nicht leistet</h2>
<ul>
<li>Er prüft nicht, ob ein Dokument dem Leitfaden entspricht, und führt keine Schematron-Regeln aus.</li>
<li>Er prüft keine Signatur, auch nicht die qualifizierte elektronische Signatur eines eArztbriefs.</li>
<li>Er bewertet keine medizinischen Inhalte und ist kein Medizinprodukt.</li>
</ul>
</div>`;
  return p;
}

// ---------------------------------------------------------------- Was ist CDA
export function whatPage(toolStatus) {
  const path = "was-ist-cda/";
  const crumbs = [["CDA-Viewer", ""], ["Was ist HL7 CDA?", path]];
  const p = { path, title: "Was ist HL7 CDA? Aufbau, C-CDA, HL7 v3 und FHIR", description: "HL7 CDA (Clinical Document Architecture) erklärt: Header und Body, Level 1 bis 3, Unterschied zu C-CDA und HL7 v3, Einordnung gegenüber FHIR-Dokumenten.", ogType: "article" };
  p.jsonld = [articleLd(p, "Was ist HL7 CDA (Clinical Document Architecture)?"), breadcrumbLd(crumbs)];
  p.body = `${breadcrumbHtml(crumbs)}
<h1>Was ist HL7 CDA (Clinical Document Architecture)?</h1>
<p class="lead">HL7 CDA ist ein XML-Standard für klinische Dokumente wie Entlassbriefe, Überweisungen, Behandlungsdokumentation oder OP-Berichte. Diese Seite ordnet CDA, C-CDA, HL7 v3 und FHIR ein. Die Datei selbst lesen Sie im ${L("", "CDA-Viewer")}.</p>
<div class="content">
<h2>Definition</h2>
<p>Die Clinical Document Architecture ist laut VHitG-Leitfaden ein Standard für den Austausch und die Speicherung klinischer Dokumentation; sie nutzt XML und wird von HL7 entwickelt. CDA Release 1 wurde im September 2000 verabschiedet, CDA Release 2 im Juli 2005 zum ANSI-Standard erhoben (Quelle: ${a("vhitg")}, Kapitel 3.2). Dieser Viewer liest Dokumente nach CDA Release 2 (CDA R2).</p>
<p>Die Abkürzung CDA wird auch in anderen Bereichen verwendet; auf dieser Seite ist immer HL7 CDA gemeint.</p>
<h2>Sechs Eigenschaften eines CDA-Dokuments</h2>
<p>Der Standard nennt sechs Kerneigenschaften (Quelle: ${a("vhitg")}, Kapitel 3.3):</p>
<ol>
<li><strong>Persistenz:</strong> das Dokument existiert dauerhaft in den sendenden oder empfangenden Systemen.</li>
<li><strong>Verantwortlichkeit für die Verwaltung:</strong> eine Organisation verwaltet das Dokument.</li>
<li><strong>Signaturfähigkeit:</strong> die Informationen können potenziell signiert werden.</li>
<li><strong>Kontext:</strong> alle Informationen stehen in einem bestimmten Kontext, zum Beispiel der Entlassung.</li>
<li><strong>Ganzheit:</strong> der Inhalt bezieht sich auf das Dokument als Ganzes; Teile sind ohne Bezug zum Dokument nicht verwendbar.</li>
<li><strong>Lesbarkeit:</strong> jedes Dokument muss die klinischen Informationen in lesbarer Form enthalten.</li>
</ol>
<h2>Aufbau: Header, Body, Level</h2>
<p>Ein CDA-Dokument hat einen <strong>Header</strong> (Dokumenttyp, Datum, Patient, Autor, Verwahrer, Beteiligte) und einen <strong>Body</strong> aus Abschnitten mit narrativem Text und optional <strong>Entries</strong>, den maschinenlesbaren Einzelinformationen (Quelle: ${a("vhitg")}, Kapitel 3.4). Der Body kann auch als <code>nonXMLBody</code> ein eingebettetes Dokument enthalten.</p>
${pre(`<ClinicalDocument xmlns="urn:hl7-org:v3">\n  <!-- Header -->\n  <recordTarget>…</recordTarget>\n  <author>…</author>\n  <custodian>…</custodian>\n  <!-- Body -->\n  <component>\n    <structuredBody>\n      <component>\n        <section>\n          <code code="11450-4" codeSystem="2.16.840.1.113883.6.1"/>\n          <title>Probleme</title>\n          <text>…lesbarer Text…</text>\n          <entry>…codierte Information (Level 3)…</entry>\n        </section>\n      </component>\n    </structuredBody>\n  </component>\n</ClinicalDocument>`)}
<p>Die Level 1 bis 3 beschreiben, wie fein das Dokument codiert ist. Die Erklärung samt Heuristik des Viewers steht unter ${L("cda-arztbrief-lesen/#level", "Arztbrief lesen")}.</p>
<h2>CDA, C-CDA und HL7 v3</h2>
<ul>
<li><strong>HL7 v3:</strong> CDA gehört zur „Familie“ der HL7-Version-3-Standards und beruht auf dem Referenz-Informationsmodell (RIM) (Quelle: ${a("vhitg")}). v3 umfasst auch Nachrichten, die Daten zwischen Systemen austauschen; ein CDA-Dokument ist keine solche Nachricht.</li>
<li><strong>C-CDA:</strong> Consolidated CDA ist ein Implementierungsleitfaden für die USA. Er wird zusammen mit dem Standard CDA R2 verwendet und definiert Dokumenttypen wie Care Plan, Consultation Note, Continuity of Care Document (CCD) und Discharge Summary sowie Header-Vorgaben (Quelle: ${a("ccda")}). Die drei englischen Beispiele im Viewer sind C-CDA-Dokumente.</li>
<li><strong>Deutsche Leitfäden:</strong> der Arztbrief-Leitfaden von HL7 Deutschland ist ein anderer Implementierungsleitfaden auf derselben Basis, siehe ${L("cda-arztbrief-lesen/", "Arztbrief lesen")}.</li>
</ul>
<p>Ein Implementierungsleitfaden schränkt CDA ein: Er legt fest, welche Abschnitte, Codes und Einträge ein Dokumenttyp enthält. Dasselbe XML-Grundgerüst kann deshalb je nach Leitfaden verschieden aussehen.</p>
<h2>CDA und FHIR</h2>
<p>FHIR beschreibt Dokumente anders: Ein FHIR-Dokument ist ein <code>Bundle</code> vom Typ <code>document</code>, das mit einer <code>Composition</code> beginnt und weitere Ressourcen enthält, auf die die Composition verweist. Das Bundle fasst den gesamten Inhalt in einem einzigen XML- oder JSON-Dokument zusammen (Quelle: ${a("fhirDoc")}). FHIR-Dokumente sind laut Spezifikation für Dokumente gedacht, die in FHIR erstellt und zusammengestellt werden; die Ressource <code>DocumentReference</code> verweist allgemein auf Dokumente, auch auf PDFs und CDAs.</p>
<p>Für die Praxis heißt das: Beide Formate bilden Dokumente ab, welches vorkommt, bestimmt der Anwendungsfall und der jeweilige Leitfaden. Eine FHIR-Datei erkennen Sie am Wurzelelement (<code>Bundle</code>, <code>Composition</code>); der CDA-Viewer meldet dann „Kein CDA-Dokument“. Wichtig für die Abgrenzung: CDA ist immer XML, FHIR gibt es als XML und als JSON.</p>
<h2>Was CDA nicht ist</h2>
<ul>
<li>Kein Bildformat: Röntgen-, CT- und MRT-Bilder liegen als DICOM vor. Ein CDA-Dokument kann auf sie verweisen.</li>
<li>Kein Nachrichtenformat wie HL7 v2, das Ereignisse zwischen Systemen überträgt.</li>
<li>Keine Darstellung: CDA enthält den lesbaren Text, die Gestaltung liefert die anzeigende Software.</li>
</ul>
</div>`;
  return p;
}

// ---------------------------------------------------------------- Datenschutz
export function privacyPage() {
  const path = "datenschutz/";
  const crumbs = [["CDA-Viewer", ""], ["Datenschutz", path]];
  const p = { path, title: "Datenschutz – CDA-Viewer", description: "Datenschutz beim CDA-Viewer: Dateien bleiben im Browser, keine Cookies, kein Tracking, Hosting über GitHub Pages.", jsonld: [breadcrumbLd(crumbs)] };
  p.body = `${breadcrumbHtml(crumbs)}
<h1>Datenschutz</h1>
<p class="lead">Kurz gesagt: Ihre Dateien verlassen Ihr Gerät nicht. Hier stehen die Einzelheiten.</p>
<div class="content">
<h2>Verantwortlicher</h2>
<p>Thomas Freimoser, München / Remote. Kontakt und vollständige Angaben im <a href="${SITE.impressum}">Impressum</a>.</p>
<h2>Ihre Dateien</h2>
<p>CDA-Dateien und eingefügter XML-Text werden ausschließlich lokal in Ihrem Browser verarbeitet. Der Viewer hat keine Upload-Funktion und überträgt Dateiinhalte nicht. Die Seite setzt eine Content-Security-Policy, die Netzwerkverbindungen der Seite (<code>connect-src 'none'</code>), fremde Skripte und fremde Ressourcen verbietet. Die Beispieldokumente sind in die Seite eingebettet. Links, die in einem Dokument stehen, öffnen sich erst, wenn Sie sie anklicken.</p>
<h2>Cookies und Speicher</h2>
<p>Die Seite setzt keine Cookies, nutzt weder localStorage noch sessionStorage.</p>
<h2 id="extern">Keine externen Ressourcen</h2>
<p>Der Viewer selbst lädt keine externen Ressourcen: keine Reichweitenmessung, keine Schriften, Skripte oder Bilder von Dritten und keine Einbindung sozialer Netzwerke. Links zu anderen Seiten (zum Beispiel zur Impressumsseite oder zu den Quellen) laden erst beim Anklicken.</p>
<h2>Hosting</h2>
<p>Diese Seite wird über GitHub Pages ausgeliefert. Beim Aufruf verarbeitet der Hoster technisch bedingt die IP-Adresse der Besucher. Wir erhalten diese Daten nicht und speichern keine personenbezogenen Daten von Ihnen. Näheres steht in der <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung von GitHub</a>.</p>
<h2>Google Search Console und Bing Webmaster Tools</h2>
<p>Die Seite enthält Bestätigungs-Meta-Tags für diese Dienste. Die Tags selbst übertragen keine Daten von Besucherinnen und Besuchern.</p>
</div>`;
  return p;
}

// ---------------------------------------------------------------- 404
export function notFoundPage() {
  return { path: "404.html", noindex: true, title: "Seite nicht gefunden – CDA-Viewer", description: "Diese Seite gibt es nicht.", about: false, body: `<h1>Seite nicht gefunden</h1>
<p class="lead">Die Adresse gibt es nicht (mehr). Hier geht es weiter:</p>
<div class="grid c3">
<a class="card-link" href="${href()}"><h3>CDA-Viewer</h3><p>HL7 CDA-Dateien im Browser lesen.</p></a>
<a class="card-link" href="${href("cda-datei-oeffnen/")}"><h3>CDA-Datei öffnen</h3><p>Anleitung und Fehlermeldungen.</p></a>
<a class="card-link" href="${href("was-ist-cda/")}"><h3>Was ist HL7 CDA?</h3><p>Grundlagen und Einordnung.</p></a>
</div>` };
}

// ---------------------------------------------------------------- Quellen
export function sourcesPage() {
  const path = "quellen/";
  const crumbs = [["CDA-Viewer", ""], ["Quellen", path]];
  const p = { path, title: "Quellen und Lizenzen – CDA-Viewer", description: "Belege für die Aussagen auf den Seiten des CDA-Viewers: Leitfäden, KBV-Richtlinie, Browserplanung, Beispieldaten und Lizenzen.", jsonld: [breadcrumbLd(crumbs)] };
  const li = (k, note) => `<li>${a(k)}${note ? ": " + note : ""}</li>`;
  p.body = `${breadcrumbHtml(crumbs)}
<h1>Quellen und Lizenzen</h1>
<p class="lead">Alle fachlichen Aussagen dieser Seiten stützen sich auf die folgenden Dokumente. Stand der Prüfung: ${SITE.updatedDe}. Die Datei <a href="${SITE.repo}/blob/main/quellen.md">quellen.md</a> im Repository enthält dieselbe Liste mit den genauen Fundstellen.</p>
<div class="content">
<h2>Standards und Leitfäden</h2>
<ul>
${li("vhitg", "Definition von CDA, Kerneigenschaften (Kapitel 3.2 bis 3.4), Level (6.2), Kopfelemente mit Kardinalitäten, Dokumenttyp- und Abschnittscodes.")}
${li("hl7de", "Einordnung des VHitG-Leitfadens v1.50 als „Arztbrief 2006“, abgelöst durch den „Arztbrief 2014/2015“.")}
${li("ccda", "Dokumenttypen und Zweck von C-CDA.")}
${li("fhirDoc", "Aufbau von FHIR-Dokumenten (Bundle, Composition) und Rolle von DocumentReference.")}
</ul>
<h2>eArztbrief</h2>
<ul>
${li("kbv", "Inhalt des elektronischen Briefes (PDF/A und XML nach VHitG v1.50, body darf leer sein, qualifizierte Signatur).")}
${li("kbvSeite", "Versand über KIM, Empfangspflicht seit 30.06.2024.")}
</ul>
<h2>Browser und XSLT</h2>
<ul>
${li("chrome", "Zeitplan der Entfernung von XSLT: Chrome 158 am 17.11.2026, Chrome 176 am 17.08.2027. Der Zeitplan kann sich ändern; maßgeblich ist die Seite von Chrome.")}
</ul>
<h2>Beispieldaten</h2>
<ul>
<li>Drei Beispiele stammen aus ${a("ccdaEx")}, Commit ad5007abd912a45bbd04ce96e871c70954c2b2c2. Die LICENSE-Datei des Repositories ist „CC0 1.0 Universal“. Die README verweist zusätzlich auf die HL7-GOM (Abschnitt 09, Geistiges Eigentum) für eingereichte Beispiele. Jede Datei trägt den Hinweis, dass sie die Daten einer fiktiven Person enthält. Geändert wurde nur eine E-Mail-Adresse (ersetzt durch isabella.jones@example.org).</li>
<li>Die zwei deutschen Beispiele sind frei erfunden und stehen unter der MIT-Lizenz des Projekts. Sie sind nicht gegen einen Leitfaden oder Schematron geprüft.</li>
<li>Codes: Die Beispiele verwenden LOINC-Codes. LOINC ist ein Urheberrecht des Regenstrief Institute, Inc.; Informationen unter <a href="https://loinc.org/">loinc.org</a>. Der Viewer enthält keine LOINC-Tabelle, nur die Codes in den Beispielen.</li>
</ul>
<h2>Marken</h2>
<p>${esc("HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen.")} Grundlage: Die Lizenzseite <a href="https://www.hl7.org/fhir/license.html">HL7 FHIR License and Copyright</a> nennt HL7®, HEALTH LEVEL SEVEN® und FHIR® als Marken von Health Level Seven International; die Namen werden hier nur beschreibend verwendet.</p>
<h2>Software</h2>
<p>Der Viewer läuft ohne Bibliotheken von Dritten. Für die automatischen Tests im Repository wird jsdom (MIT-Lizenz) verwendet; es gehört nicht zur ausgelieferten Seite. Details: <a href="${SITE.repo}/blob/main/THIRD-PARTY-LICENSES">THIRD-PARTY-LICENSES</a>.</p>
<h2>Fehler melden</h2>
<p>Stimmt eine Aussage nicht mehr, oder zeigt der Viewer eine Datei falsch an? Ein Hinweis im <a href="${SITE.repo}/issues">Issue-Tracker auf GitHub</a> hilft. Bitte hängen Sie keine echten Patientendaten an.</p>
</div>`;
  return p;
}
