import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { JSDOM } from "jsdom";
import { wellFormedError, analyze, parseCda, sanitizeNarrative, extractEntries, flattenSections, formatTs, validTs, formatTime } from "../src/js/cda.mjs";

const dom = new JSDOM("<!doctype html><body></body>");
const DP = dom.window.DOMParser;
const doc = dom.window.document;
const SAMPLES = "src/samples/";
const read = (f) => readFileSync(SAMPLES + f, "utf8");
const A = (x) => analyze(x, DP);

test("Zeitstempel", () => {
  assert.equal(formatTs("20261012143000+0200"), "12.10.2026 14:30:00 (UTC+02:00)");
  assert.equal(formatTs("19520314"), "14.03.1952");
  assert.equal(formatTs("202610"), "10/2026");
  assert.ok(validTs("20261012") && !validTs("20261312") && !validTs("abc"));
});

test("alle Beispiele laden, Kopf und Abschnitte vorhanden", () => {
  const files = readdirSync(SAMPLES).filter((f) => f.endsWith(".xml"));
  assert.ok(files.length >= 5);
  for (const f of files) {
    const r = A(read(f));
    assert.ok(r.ok, f + ": " + (r.error && r.error.message));
    assert.ok(r.header.title, f + " title");
    assert.ok(r.header.patients.length >= 1, f + " patient");
    assert.ok(r.header.authors.length >= 1, f + " author");
    assert.ok(r.sections.length >= 1, f + " sections");
    assert.ok(r.nsOk);
    assert.ok(r.hints.length > 0);
  }
});

test("Entlassbrief: Level 2, Header-Felder", () => {
  const r = A(read("de-arztbrief-entlassbrief.xml"));
  assert.equal(r.level.level, 2);
  assert.equal(r.header.patients[0].name, "Hannelore Probst-Beispiel");
  assert.equal(r.header.patients[0].birth, "14.03.1952");
  assert.equal(r.header.effectiveTime, "12.10.2026 14:30:00 (UTC+02:00)");
  assert.equal(r.header.encounter.time, "05.10.2026 – 12.10.2026");
  assert.equal(r.header.recipients[0].name, "Dr. med. Karl Hausarzt-Muster");
  assert.equal(r.header.code.code, "34106-5");
  assert.equal(r.header.code.codeSystemName, "LOINC");
  assert.equal(flattenSections(r.sections).length, 5);
});

test("Facharztbrief: Level 3, Entries mit Werten und Einheiten", () => {
  const r = A(read("de-arztbrief-facharzt-level3.xml"));
  assert.equal(r.level.level, 3);
  const vit = extractEntries(r.sections[0]);
  assert.equal(vit.length, 5); // organizer + 4 observations
  assert.equal(vit[1].code.code, "8480-6");
  assert.equal(vit[1].values[0].text, "148");
  assert.equal(vit[1].values[0].unit, "mm[Hg]");
  assert.equal(vit[1].depth, 1);
  assert.ok(vit[1].extra.some((x) => x.includes("#bd1")));
  const lab = extractEntries(r.sections[1]);
  assert.equal(lab.length, 2);
  assert.equal(lab[0].values[0].unit, "mg/dL");
});

test("C-CDA-Beispiele: Level 3 und viele Einträge", () => {
  const r = A(read("hl7-ccda-ccd.xml"));
  assert.equal(r.level.level, 3);
  assert.ok(r.header.templateIds.length >= 1);
  assert.ok(r.header.realmCode.includes("US"));
  const n = flattenSections(r.sections).reduce((a, { s }) => a + extractEntries(s).length, 0);
  assert.ok(n >= 15);
});

test("kein Wurzel-CDA / kaputtes XML / leer / DOCTYPE", () => {
  assert.equal(A("").error.code, "leer");
  assert.equal(A("<a><b></a>").error.code, "xml");
  assert.equal(A("MSH|^~\\&|X").error.code, "xml");
  const f = A('<Bundle xmlns="http://hl7.org/fhir"/>');
  assert.equal(f.error.code, "kein-cda");
  assert.match(f.error.hint, /FHIR/);
  const d = A('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><ClinicalDocument xmlns="urn:hl7-org:v3"/>');
  assert.equal(d.error.code, "doctype");
  assert.equal(A("<ClinicalDocument xmlns='urn:hl7-org:v3'/>").ok, true);
});

test("falscher Namensraum und fehlende Kopfteile erzeugen Hinweise", () => {
  const r = A("<ClinicalDocument><id root='1'/></ClinicalDocument>");
  assert.ok(r.ok);
  const t = r.hints.map((h) => h.text).join("\n");
  assert.match(t, /Namensraum/);
  assert.match(t, /typeId fehlt/);
  assert.match(t, /recordTarget/);
});

test("Sanitizer: Allowlist, kein Script, keine Handler, keine fremden Links", () => {
  const xml = `<ClinicalDocument xmlns="urn:hl7-org:v3"><component><structuredBody><component><section><title>t</title><text>
    <paragraph onclick="alert(1)">A<script>alert(1)</script><img src="x" onerror="alert(2)"/></paragraph>
    <content styleCode="Bold" style="x" onmouseover="alert(3)">fett</content>
    <linkHtml href="javascript:alert(4)">js</linkHtml><linkHtml href="https://example.org/x">ok</linkHtml>
    <table><tr><td colspan="2" onclick="x()">c</td><td colspan="9999999">d</td></tr></table>
    <renderMultiMedia referencedObject="m1"/><foo>unbekannt-text</foo>
    <iframe src="https://evil.example">i</iframe>
  </text></section></component></structuredBody></component></ClinicalDocument>`;
  const r = A(xml);
  const { frag, stats } = sanitizeNarrative(r.sections[0].textEl, doc);
  const host = doc.createElement("div"); host.appendChild(frag);
  const html = host.innerHTML;
  assert.ok(!/<script|<img|<iframe|onclick|onerror|onmouseover|javascript:|style=/i.test(html), html);
  assert.ok(html.includes('class="cda-b"'));
  assert.ok(html.includes('href="https://example.org/x"') && html.includes('rel="noopener noreferrer nofollow"'));
  assert.ok(!html.includes("9999999"));
  assert.ok(html.includes("unbekannt-text"));
  assert.ok(html.includes("vom Viewer nicht angezeigt"));
  assert.ok(stats.dropped.includes("script") && stats.dropped.includes("img") && stats.dropped.includes("iframe"));
  assert.ok(stats.unknown.has("foo"));
  // Skripttext darf nicht als Text auftauchen
  assert.ok(!html.includes("alert(1)"));
});

test("Sanitizer: Attributnamen sind nur aus Allowlist", () => {
  const xml = `<ClinicalDocument xmlns="urn:hl7-org:v3"><component><structuredBody><component><section><text>
    <table id="x" name="y" class="z"><tr><th id="a" ID="ok1" align="center">h</th></tr></table></text></section></component></structuredBody></component></ClinicalDocument>`;
  const r = A(xml);
  const { frag } = sanitizeNarrative(r.sections[0].textEl, doc);
  const host = doc.createElement("div"); host.appendChild(frag);
  for (const el of host.querySelectorAll("*")) for (const a of el.attributes) assert.ok(["class", "colspan", "rowspan", "href", "rel", "target", "data-cda-id", "title"].includes(a.name), a.name);
  assert.ok(!/\sid="/.test(host.innerHTML));
});

test("Tiefe: extrem verschachtelte Narrative stürzt nicht ab", () => {
  const open = "<content>".repeat(5000), close = "</content>".repeat(5000);
  const xml = `<ClinicalDocument xmlns="urn:hl7-org:v3"><component><structuredBody><component><section><text>${open}tief${close}</text></section></component></structuredBody></component></ClinicalDocument>`;
  const r = A(xml);
  const { frag } = sanitizeNarrative(r.sections[0].textEl, doc);
  assert.ok(frag.textContent.includes("tief"));
});

test("formatTime Intervalle", () => {
  const x = new DP().parseFromString('<e xmlns="urn:hl7-org:v3"><low value="20200101"/><high nullFlavor="UNK"/></e>', "application/xml").documentElement;
  assert.equal(formatTime(x), "01.01.2020 – offen");
});

import { documentView, dataView, rawView, hintsView, errorView, prettyXml } from "../src/js/render.mjs";
test("Renderer erzeugt alle Ansichten für alle Beispiele ohne Fehler", () => {
  for (const f of readdirSync(SAMPLES).filter((x) => x.endsWith(".xml"))) {
    const x = read(f), r = A(x);
    const d = documentView(doc, r), s = dataView(doc, r), raw = rawView(doc, r, x), hv = hintsView(doc, r);
    assert.ok(d.querySelector("h2.doctitle"), f);
    assert.ok(d.querySelectorAll("section.csec").length >= 1, f);
    assert.ok(s.querySelectorAll("section.dsec").length >= 1, f);
    assert.ok(raw.querySelector("pre").textContent.length > 100);
    assert.ok(hv.querySelector("li"));
    for (const v of [d, s, raw, hv]) assert.ok(!v.querySelector("script,iframe,img,object,[onclick],[onerror]"), f);
  }
});
test("Roh-XML eingerückt, Fehleransicht", () => {
  const r = A("<ClinicalDocument xmlns='urn:hl7-org:v3'><id root='1'/><title>A &amp; B</title></ClinicalDocument>");
  assert.match(prettyXml(r.root), /<title>A &amp; B<\/title>/);
  const e = errorView(doc, A("<a>").error);
  assert.match(e.textContent, /wohlgeformtes XML/);
});
test("Dokumentansicht der Facharztbriefs zeigt Tabellen, Kopf und Navigation", () => {
  const r = A(read("de-arztbrief-facharzt-level3.xml"));
  const d = documentView(doc, r);
  assert.ok(d.querySelector("table"));
  assert.match(d.textContent, /Jonas Testmann/);
  assert.match(d.textContent, /Musterherz/);
  assert.equal(d.querySelectorAll("nav.toc li").length, 3);
});

test("Vorprüfung: keine Fehlalarme bei allen Beispielen und Testdateien", () => {
  for (const f of readdirSync(new URL("../src/samples/", import.meta.url))) {
    assert.equal(wellFormedError(readFileSync(new URL("../src/samples/" + f, import.meta.url), "utf8")), null, f);
  }
  assert.equal(wellFormedError('<?xml version="1.0"?><!-- c --><a x="1" y=\'2\'><![CDATA[ <&> ]]><b/>&amp;&#x41;&#65;</a>'), null);
});
test("Vorprüfung: erkennt eindeutige Fehler mit Zeile und Spalte", () => {
  const cases = [
    ["<a><b></a>", /passt nicht/], ["<a>", /nicht geschlossen/], ["<a>x & y</a>", /&amp;/], ["<a>x < y</a>", /&lt;/],
    ["<a x=1/>", /abgeschlossen/], ["<a x='1' x='2'/>", /doppelt/], ["kein xml", /Vor dem Wurzelelement/], ["", /Wurzelelement/], ["<a/><b/>", /weiteres Element/], ["<a></a></b>", /ohne passendes|weiterer|Nach/],
  ];
  for (const [x, re] of cases) { const e = wellFormedError(x); assert.ok(e, x); assert.match(e.msg, re, x); }
  assert.equal(wellFormedError("<a>\n<b>\n</a>").line, 3);
});
test("parseCda: kaputtes XML liefert Fehler ohne DOMParser-parsererror", () => {
  let called = false;
  class P { parseFromString() { called = true; return null; } }
  const r = parseCda("<a><b></a>", P);
  assert.equal(r.ok, false); assert.equal(called, false); assert.match(r.error.hint, /Zeile 1/);
});
