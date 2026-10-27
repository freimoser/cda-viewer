/** Prüft das gebaute Root gegen den lokalen Server (node scripts/serve.mjs muss laufen): interne Links samt Fragmenten, JSON-LD, Sitemap, Pflicht-Tags. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = process.env.ORIGIN || "http://localhost:8777";
const LIVE = "https://freimoser.github.io";
const errors = [];
const err = (m) => errors.push(m);
const get = async (u) => { const r = await fetch(u); return { status: r.status, text: await r.text() }; };

const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) err("sitemap leer");
const idCache = new Map();
let flex = 0;
for (const loc of locs) {
  const local = loc.replace(LIVE, ORIGIN);
  const r = await get(local);
  if (r.status !== 200) { err(`${loc}: Status ${r.status}`); continue; }
  const dom = new JSDOM(r.text);
  const d = dom.window.document;
  idCache.set(local, new Set([...d.querySelectorAll("[id]")].map((e) => e.id)));
  // Pflicht-Tags
  const need = { "canonical": d.querySelector('link[rel=canonical]')?.href, "title": d.title, "description": d.querySelector('meta[name=description]')?.content, "h1": d.querySelectorAll("h1").length === 1, "google": d.querySelector('meta[name=google-site-verification]'), "bing": d.querySelector('meta[name="msvalidate.01"]'), "og:image": d.querySelector('meta[property="og:image"]'), "twitter": d.querySelector('meta[name="twitter:card"]'), "theme": d.querySelector('meta[name=theme-color]') };
  for (const [k, v] of Object.entries(need)) if (!v) err(`${loc}: ${k} fehlt`);
  if (need.canonical && need.canonical !== loc) err(`${loc}: canonical ${need.canonical}`);
  // JSON-LD
  for (const s of d.querySelectorAll('script[type="application/ld+json"]')) { try { JSON.parse(s.textContent); } catch (e) { err(`${loc}: JSON-LD ungültig: ${e.message}`); } }
  if (!d.querySelector('script[type="application/ld+json"]')) err(`${loc}: kein JSON-LD`);
  // Links
  for (const a of d.querySelectorAll("a[href]")) {
    const h = a.getAttribute("href");
    if (/flexchange/.test(h)) flex++;
    if (/^(mailto:|tel:)/.test(h)) continue;
    let u;
    try { u = new URL(h, loc); } catch { err(`${loc}: ungültiger Link ${h}`); continue; }
    if (u.origin !== LIVE || !u.pathname.startsWith("/cda-viewer/")) continue;
    const target = ORIGIN + u.pathname;
    const rr = await get(target);
    if (rr.status !== 200) { err(`${loc}: Link ${h} → ${rr.status}`); continue; }
    if (u.hash && !u.hash.startsWith("#beispiel=") && /html/.test(target + "x") && !/\.(xml|txt|png)$/.test(u.pathname)) {
      let ids = idCache.get(target);
      if (!ids) { const dd = new JSDOM(rr.text).window.document; ids = new Set([...dd.querySelectorAll("[id]")].map((e) => e.id)); idCache.set(target, ids); }
      if (!ids.has(decodeURIComponent(u.hash.slice(1)))) err(`${loc}: Fragment ${h} nicht gefunden`);
    }
    if (u.hash.startsWith("#beispiel=")) {
      const sid = u.hash.slice(10);
      if (!readFileSync(join(root, "assets/js/samples-data.js"), "utf8").includes(`"id":"${sid}"`)) err(`${loc}: unbekanntes Beispiel ${sid}`);
    }
  }
  for (const el of d.querySelectorAll("[src],link[href]")) {
    const h = el.getAttribute("src") || el.getAttribute("href");
    if (/^https?:/.test(h) && !h.startsWith(LIVE)) err(`${loc}: externe Ressource ${h}`);
    if (/^\/cda-viewer\//.test(h)) { const rr = await fetch(ORIGIN + h.split("#")[0]); if (rr.status !== 200) err(`${loc}: Ressource ${h} → ${rr.status}`); }
  }
}
if (flex > 1) err(`flexchange-Links: ${flex} (erlaubt: 0 oder 1 im gesamten Auftritt)`);
for (const f of ["robots.txt", "llms.txt", "c67e9b3d19be863e1c5ec56c3a89f916.txt", "site.webmanifest", "og-image.png", "favicon.ico", "404.html"]) {
  const r = await fetch(`${ORIGIN}/cda-viewer/${f}`); if (r.status !== 200 && f !== "404.html") err(`${f}: ${r.status}`);
}
console.log(`${locs.length} Sitemap-URLs geprüft, flexchange-Links: ${flex}`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("check: OK");
