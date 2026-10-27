/** Build: erzeugt alle Seiten und Dateien im Repository-Root (GitHub Pages liefert main/ aus). Aufruf: node scripts/build.mjs */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { analyze } from "../src/js/cda.mjs";
import { SITE, url, page } from "./lib/layout.mjs";
import { SAMPLES, indexPage, openPage, arztbriefPage, whatPage, privacyPage, sourcesPage, notFoundPage } from "./lib/content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (...p) => join(root, ...p);
const write = (rel, data) => { mkdirSync(dirname(out(rel)), { recursive: true }); writeFileSync(out(rel), data); };

// 1. Schwesterseiten prüfen (nur verlinken, was HTTP 200 liefert); ohne Netz gilt der letzte bekannte Stand
const SIB = ["ldt-bdt-viewer", "gdt-viewer", "dicom-viewer", "fhir-viewer", "hl7v2-viewer", "e-rechnung-klartext"];
const cacheFile = out("scripts", "siblings.json");
let toolStatus = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
if (!process.env.OFFLINE) {
  for (const id of SIB) {
    try {
      const r = await fetch(`${SITE.origin}/${id}/`, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
      toolStatus[id] = r.status === 200;
    } catch { if (!(id in toolStatus)) toolStatus[id] = false; }
  }
  writeFileSync(cacheFile, JSON.stringify(toolStatus, null, 1) + "\n");
}
console.log("Schwesterseiten:", JSON.stringify(toolStatus));

// 2. Beispiele analysieren (Kennzahlen für die Karten) und einbetten
const dom = new JSDOM("<!doctype html><body></body>");
const stats = {};
const embedded = [];
mkdirSync(out("beispiele"), { recursive: true });
for (const s of SAMPLES) {
  const xml = readFileSync(out("src", "samples", s.file), "utf8");
  const r = analyze(xml, dom.window.DOMParser);
  if (!r.ok) throw new Error(`Beispiel ${s.file}: ${r.error.message}`);
  const flat = [];
  const walk = (secs) => secs.forEach((x) => { flat.push(x); walk(x.children); });
  walk(r.sections);
  stats[s.id] = { sections: flat.length, entries: flat.reduce((n, x) => n + x.entries.length, 0), level: r.level.level };
  copyFileSync(out("src", "samples", s.file), out("beispiele", s.file));
  embedded.push({ id: s.id, file: s.file, title: s.title, source: s.source, license: s.license, xml });
}
const jsLit = JSON.stringify(embedded).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

// 3. Skripte und Styles kopieren
for (const f of ["cda.mjs", "render.mjs", "app.mjs", "menu.mjs"]) { mkdirSync(out("assets", "js"), { recursive: true }); copyFileSync(out("src", "js", f), out("assets", "js", f)); }
write("assets/js/samples-data.js", `// Erzeugt von scripts/build.mjs aus src/samples/. Nicht von Hand ändern.\nexport const SAMPLES = ${jsLit};\n`);
mkdirSync(out("assets", "css"), { recursive: true });
copyFileSync(out("src", "css", "styles.css"), out("assets", "css", "styles.css"));

// 4. Statische Dateien (Icons, og-image) aus src/static
for (const f of existsSync(out("src", "static")) ? readdirSync(out("src", "static")) : []) copyFileSync(out("src", "static", f), out(f));

// 5. Seiten
const pages = [indexPage(stats, toolStatus), openPage(toolStatus), arztbriefPage(toolStatus), whatPage(toolStatus), sourcesPage(), privacyPage()];
for (const p of pages) write(p.path === "" ? "index.html" : p.path + "index.html", page(p, toolStatus));
write("404.html", page(notFoundPage(), toolStatus));

// 6. Maschinenlesbare Dateien
const lastmod = SITE.updated;
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `<url><loc>${url(p.path)}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\n# KI-Crawler ausdrücklich erlaubt\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\nUser-agent: CCBot\nAllow: /\n\nSitemap: ${url("sitemap.xml")}\n`);
write(`${SITE.indexNowKey}.txt`, SITE.indexNowKey);
write(".nojekyll", "");
write("site.webmanifest", JSON.stringify({ name: "CDA-Viewer", short_name: "CDA-Viewer", description: "HL7 CDA-Arztbriefe im Browser lesen", lang: "de", start_url: SITE.base, scope: SITE.base, display: "standalone", background_color: SITE.themeColor, theme_color: SITE.themeColor, icons: [{ src: SITE.base + "icon-192.png", sizes: "192x192", type: "image/png" }, { src: SITE.base + "icon-512.png", sizes: "512x512", type: "image/png" }, { src: SITE.base + "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] }, null, 1) + "\n");

const sib = Object.entries(toolStatus).filter(([, ok]) => ok).map(([id]) => id);
const titleOf = (p) => `- [${p.title}](${url(p.path)}): ${p.description}`;
write("llms.txt", `# CDA-Viewer

> Kostenloser Viewer für HL7 CDA-Dokumente (Clinical Document Architecture, R2) im Browser, auf Deutsch. Zeigt Arztbriefe, Entlassbriefe und C-CDA-Dokumente lesbar an: Kopf, Abschnitte, Narrativtext, codierte Einträge (Level 3) als Tabelle, Roh-XML und Druckansicht. Arbeitet ohne XSLT (DOMParser und eigener Renderer), ohne Upload, ohne Cookies, ohne Tracking. Nur zur Ansicht, kein Medizinprodukt, keine Schema- oder Schematron-Prüfung, keine Signaturprüfung.

Grenzen: Dateien bis 15 MB; Dateien mit DOCTYPE oder ENTITY werden abgelehnt; renderMultiMedia und nonXMLBody (eingebettetes PDF) werden nicht angezeigt; ein eingetragenes Stylesheet wird ignoriert.

## Seiten
${pages.map(titleOf).join("\n")}

## Beispieldateien (XML, zum Herunterladen)
${SAMPLES.map((s) => `- [${s.title}](${url("beispiele/" + s.file)}): ${s.badge}, Lizenz ${s.license}`).join("\n")}

## Quellen (Auswahl)
- [VHitG-Arztbrief-Leitfaden v1.50](https://download.hl7.de/documents/cdar2-arztbrief/Leitfaden-VHitG-Arztbrief-v150.pdf)
- [KBV, Richtlinie elektronischer Brief](https://www.kbv.de/documents/infothek/rechtsquellen/weitere-vertraege/praxen/telemedizin/rl-earztbrief.pdf)
- [Chrome for Developers, Removing XSLT](https://developer.chrome.com/docs/web-platform/deprecating-xslt)
- [Consolidated CDA (C-CDA) IG](https://hl7.org/cda/us/ccda/)

## Weitere Werkzeuge
${sib.map((id) => `- [${id}](${SITE.origin}/${id}/)`).join("\n")}

## Entwickler
- [Thomas Freimoser](${SITE.author.url})
- [LinkedIn](${SITE.author.linkedin})
- [Quellcode](${SITE.repo})

HL7® und FHIR® sind eingetragene Marken von Health Level Seven International. Dieses Werkzeug ist ein unabhängiges Projekt und wird von HL7 International weder bereitgestellt noch empfohlen. Stand: ${SITE.updatedDe}.
`);
console.log("Build fertig:", pages.length + 1, "Seiten,", SAMPLES.length, "Beispiele");
